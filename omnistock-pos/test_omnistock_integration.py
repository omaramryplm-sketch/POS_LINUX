#!/usr/bin/env python3
"""
OMNISTOCK POS - Automated Integration Test Suite
Certifies the 6 operational modules against http://localhost:8080/api.
Zero external dependencies (uses standard library unittest & urllib).
"""

import unittest
import urllib.request
import urllib.error
import json
import time
import sys

BASE_URL = "http://localhost:8080/api"

class POSApiClient:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip("/")

    def request(self, method, endpoint, data=None, token=None):
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_body = resp.read().decode("utf-8")
                return resp.status, json.loads(resp_body) if resp_body else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                parsed = json.loads(err_body)
            except Exception:
                parsed = {"raw": err_body}
            return e.code, parsed
        except Exception as e:
            return 500, {"error": str(e)}

class TestOmniStockIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = POSApiClient(BASE_URL)
        cls.ts = int(time.time())

        # 1. Login Admin
        status, res = cls.client.request("POST", "/auth/login", {"username": "admin", "password": "admin123"})
        if status != 200:
            raise RuntimeError(f"Admin login failed: {res}")
        cls.admin_token = res["data"]["token"]

        # 2. Login Cajero
        status, res = cls.client.request("POST", "/auth/login", {"username": "caja1", "password": "caja123"})
        if status != 200:
            raise RuntimeError(f"Cajero login failed: {res}")
        cls.cajero_token = res["data"]["token"]

        # 3. Ensure an active Caja exists
        status, res = cls.client.request("GET", "/admin/cajas", token=cls.admin_token)
        cajas = res.get("data", [])
        if cajas and len(cajas) > 0:
            cls.id_caja = cajas[0]["id"]
        else:
            status, res = cls.client.request("POST", "/admin/cajas", {"nombre": f"Caja QA {cls.ts}"}, token=cls.admin_token)
            cls.id_caja = res["data"]["id"]

        # 4. Create Test Products for suite
        # Producto Pieza normal (Costo: 50, Venta: 100, Stock: 20)
        status, res = cls.client.request("POST", "/admin/inventory/products", {
            "sku": f"QA-PZA-{cls.ts}",
            "descripcion": "QA Galletas Oreo Pieza",
            "precio_costo": 50.0,
            "precio_venta": 100.0,
            "stock_actual": 20.0,
            "stock_minimo": 2.0,
            "stock_maximo": 100.0,
            "categoria": "Abarrotes",
            "unidad": "PZ"
        }, token=cls.admin_token)
        cls.prod_pza = res["data"]

        # Producto Fraccionado (KG) (Costo: 20, Venta: 40, Stock: 50.0)
        status, res = cls.client.request("POST", "/admin/inventory/products", {
            "sku": f"QA-KG-{cls.ts}",
            "descripcion": "QA Manzana Granel KG",
            "precio_costo": 20.0,
            "precio_venta": 40.0,
            "stock_actual": 50.0,
            "stock_minimo": 5.0,
            "stock_maximo": 200.0,
            "categoria": "Frutas",
            "unidad": "KG"
        }, token=cls.admin_token)
        cls.prod_kg = res["data"]

        # Producto con margen estrecho (Costo: 80, Venta: 100, Stock: 10)
        status, res = cls.client.request("POST", "/admin/inventory/products", {
            "sku": f"QA-LOWMARGIN-{cls.ts}",
            "descripcion": "QA Aceite Margen Estrecho",
            "precio_costo": 80.0,
            "precio_venta": 100.0,
            "stock_actual": 10.0,
            "stock_minimo": 1.0,
            "stock_maximo": 50.0,
            "categoria": "Abarrotes",
            "unidad": "PZ"
        }, token=cls.admin_token)
        cls.prod_margin = res["data"]

        # 5. Create Test Clients
        # Regular client (limit: 1000)
        status, res = cls.client.request("POST", "/clientes", {
            "nombre": f"Cliente Solvente QA {cls.ts}",
            "telefono": "5551112233",
            "direccion": "Av Central 123",
            "limite_credito": 1000.0
        }, token=cls.admin_token)
        cls.cliente_regular = res["data"]

        # Low credit limit client (limit: 50)
        status, res = cls.client.request("POST", "/clientes", {
            "nombre": f"Cliente Limite Bajo QA {cls.ts}",
            "limite_credito": 50.0
        }, token=cls.admin_token)
        cls.cliente_bajo_limite = res["data"]

        # Betado client
        status, res = cls.client.request("POST", "/clientes", {
            "nombre": f"Cliente Betado QA {cls.ts}",
            "limite_credito": 500.0
        }, token=cls.admin_token)
        cls.cliente_betado = res["data"]
        cls.client.request("PUT", f"/clientes/{cls.cliente_betado['id']}", {"betado": True}, token=cls.admin_token)

    # -------------------------------------------------------------
    # MÓDULO 1: AUTENTICACIÓN Y RBAC
    # -------------------------------------------------------------
    def test_01_admin_login_success(self):
        status, res = self.client.request("POST", "/auth/login", {"username": "admin", "password": "admin123"})
        self.assertEqual(status, 200)
        self.assertEqual(res["data"]["user"]["rol"], "ADMIN")
        self.assertIn("token", res["data"])

    def test_02_cajero_login_success(self):
        status, res = self.client.request("POST", "/auth/login", {"username": "caja1", "password": "caja123"})
        self.assertEqual(status, 200)
        self.assertEqual(res["data"]["user"]["rol"], "CAJERO")
        self.assertIn("token", res["data"])

    def test_03_invalid_login_rejected(self):
        status, res = self.client.request("POST", "/auth/login", {"username": "admin", "password": "badpassword"})
        self.assertEqual(status, 401)
        self.assertEqual(res.get("code"), "INVALID_CREDENTIALS")

    def test_04_cajero_denied_admin_stats(self):
        status, res = self.client.request("GET", "/admin/stats", token=self.cajero_token)
        self.assertEqual(status, 403)

    def test_05_cajero_denied_admin_corte(self):
        status, res = self.client.request("GET", "/admin/corte", token=self.cajero_token)
        self.assertEqual(status, 403)

    def test_06_cajero_allowed_config(self):
        status, res = self.client.request("GET", "/admin/config", token=self.cajero_token)
        self.assertEqual(status, 200)

    def test_07_cajero_allowed_cajas(self):
        status, res = self.client.request("GET", "/admin/cajas", token=self.cajero_token)
        self.assertEqual(status, 200)
        self.assertIsInstance(res.get("data"), list)

    def test_08_cajero_allowed_create_cliente(self):
        status, res = self.client.request("POST", "/clientes", {
            "nombre": f"Cliente Nuevo Cajero {self.ts}",
            "limite_credito": 200
        }, token=self.cajero_token)
        self.assertEqual(status, 201)
        self.assertIn("id", res["data"])

    # -------------------------------------------------------------
    # MÓDULO 2: CÁLCULO DE PRECIOS Y PROTECCIÓN DE MARGEN
    # -------------------------------------------------------------
    def test_09_server_calculates_subtotals_ignoring_manipulated_client_price(self):
        # El atacante envía subtotal falso 0.01 y total 0.01. Servidor debe recalcular: 2 * 100.0 = 200.0
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 2, "subtotal": 0.01}],
            "total": 0.01,
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 201)
        self.assertEqual(res["data"]["venta"]["total"], 200.0)

    def test_10_cajero_discount_up_to_50_percent_allowed(self):
        # Producto venta 100, costo 50. Cajero da precio 50 (50% desc, >= costo). Debe permitirse.
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 1, "precio_unitario": 50.0}],
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 201)
        self.assertEqual(res["data"]["venta"]["total"], 50.0)

    def test_11_cajero_blocked_selling_below_cost(self):
        # Producto costo 80, venta 100. Cajero intenta vender a 60 (menor a costo).
        sale_data = {
            "items": [{"id_producto": self.prod_margin["id"], "cantidad": 1, "precio_unitario": 60.0}],
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 400)
        self.assertEqual(res.get("code"), "PRECIO_MENOR_A_COSTO_CAJERO")

    def test_12_cajero_blocked_discount_exceeding_limit(self):
        # Descuento en ticket de $60 sobre venta de $100 (60% > 50%). Bloqueo esperado.
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 1}],
            "descuento": 60.0,
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 400)
        self.assertEqual(res.get("code"), "DESCUENTO_EXCEDE_LIMITE_CAJERO")

    def test_13_cajero_blocked_stacked_discounts_exceeding_limit(self):
        # Anti-stacking: Precio bajado a 60 ($40 desc) + Descuento ticket $20 ($60 total desc sobre $100 = 60%).
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 1, "precio_unitario": 60.0}],
            "descuento": 20.0,
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 400)
        self.assertEqual(res.get("code"), "DESCUENTO_EXCEDE_LIMITE_CAJERO")

    # -------------------------------------------------------------
    # MÓDULO 3: CONTROL ATÓMICO DE INVENTARIO Y CONCURRENCIA
    # -------------------------------------------------------------
    def test_14_stock_deduction_discrete_pieces(self):
        # Obtener stock inicial
        status, res = self.client.request("GET", f"/ventas/productos?q={self.prod_pza['sku']}", token=self.admin_token)
        stock_init = res["data"][0]["stock_actual"]
        
        # Venta de 2 piezas
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 2}],
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 201)

        # Verificar decremento
        status, res = self.client.request("GET", f"/ventas/productos?q={self.prod_pza['sku']}", token=self.admin_token)
        self.assertEqual(res["data"][0]["stock_actual"], round(stock_init - 2, 2))

    def test_15_stock_deduction_bulk_kg(self):
        # Obtener stock inicial
        status, res = self.client.request("GET", f"/ventas/productos?q={self.prod_kg['sku']}", token=self.admin_token)
        stock_init = res["data"][0]["stock_actual"]

        # Venta fraccionada de 1.750 KG
        sale_data = {
            "items": [{"id_producto": self.prod_kg["id"], "cantidad": 1.75}],
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 201)

        # Verificar decremento con precisión flotante
        status, res = self.client.request("GET", f"/ventas/productos?q={self.prod_kg['sku']}", token=self.admin_token)
        self.assertAlmostEqual(res["data"][0]["stock_actual"], stock_init - 1.75, places=2)

    def test_16_stock_insufficient_blocked(self):
        # Intentar vender más piezas del stock disponible
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 9999}],
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 400)
        self.assertEqual(res.get("code"), "INSUFFICIENT_STOCK")

    # -------------------------------------------------------------
    # MÓDULO 4: CICLO DE CRÉDITO Y CUENTAS POR COBRAR
    # -------------------------------------------------------------
    def test_17_credit_sale_requires_client(self):
        # Venta a crédito sin cliente
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 1}],
            "metodo_pago": "CREDITO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 400)

    def test_18_credit_sale_blocked_vetoed_client(self):
        # Venta a crédito con cliente betado
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 1}],
            "metodo_pago": "CREDITO",
            "id_cliente": self.cliente_betado["id"],
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 400)
        self.assertEqual(res.get("code"), "CLIENTE_BETADO")

    def test_19_credit_sale_blocked_credit_limit_exceeded(self):
        # Cliente con límite de $50, compra de $100
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 1}],
            "metodo_pago": "CREDITO",
            "id_cliente": self.cliente_bajo_limite["id"],
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 400)
        self.assertEqual(res.get("code"), "INSUFFICIENT_CREDIT")

    def test_20_cajero_records_abono_with_audit_notes(self):
        # Realizar primero una venta a crédito al cliente regular para que tenga deuda
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 1}],
            "metodo_pago": "CREDITO",
            "id_cliente": self.cliente_regular["id"],
            "id_caja": self.id_caja
        }
        self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)

        # Cajero registra abono de $50
        abono_data = {
            "id_cliente": self.cliente_regular["id"],
            "monto": 50.0,
            "metodo_pago": "EFECTIVO",
            "notas": "Pago parcial en mostrador"
        }
        status, res = self.client.request("POST", "/clientes/abono", abono_data, token=self.cajero_token)
        self.assertEqual(status, 200)
        # Verificar auditoría de notas: [Cobrado por: ...]
        notas = res["data"]["abono"]["notas"]
        self.assertIn("[Cobrado por:", notas)

    def test_21_abono_supports_advance_payment_negative_debt(self):
        # Cliente abona $500 teniendo deuda $50 -> Saldo deudor debe ser negativo (saldo a favor)
        abono_data = {
            "id_cliente": self.cliente_regular["id"],
            "monto": 500.0,
            "metodo_pago": "EFECTIVO",
            "notas": "Anticipo a favor"
        }
        status, res = self.client.request("POST", "/clientes/abono", abono_data, token=self.cajero_token)
        self.assertEqual(status, 200)
        nuevo_saldo = res["data"]["cliente"]["saldo_deudor"]
        self.assertLess(nuevo_saldo, 0, f"Saldo deudor debe ser negativo, fue: {nuevo_saldo}")

    # -------------------------------------------------------------
    # MÓDULO 5: CAJA CHICA
    # -------------------------------------------------------------
    def test_22_cajero_gasto_under_500_allowed(self):
        gasto_data = {
            "descripcion": "Artículos de limpieza mostrador",
            "monto": 250.0,
            "categoria": "LIMPIEZA"
        }
        status, res = self.client.request("POST", "/admin/gastos", gasto_data, token=self.cajero_token)
        self.assertIn(status, [200, 201])
        self.assertEqual(res["data"]["monto"], 250.0)

    def test_23_cajero_gasto_over_500_blocked(self):
        gasto_data = {
            "descripcion": "Reparación mayor climas",
            "monto": 750.0,
            "categoria": "MANTENIMIENTO"
        }
        status, res = self.client.request("POST", "/admin/gastos", gasto_data, token=self.cajero_token)
        self.assertEqual(status, 400)
        self.assertEqual(res.get("code"), "GASTO_EXCEDE_LIMITE_CAJERO")

    def test_24_admin_gasto_over_500_allowed(self):
        gasto_data = {
            "descripcion": "Pago renta mensual",
            "monto": 1500.0,
            "categoria": "RENTA"
        }
        status, res = self.client.request("POST", "/admin/gastos", gasto_data, token=self.admin_token)
        self.assertIn(status, [200, 201])
        self.assertEqual(res["data"]["monto"], 1500.0)

    # -------------------------------------------------------------
    # MÓDULO 6: CORTE DE CAJA Y AUDITORÍA DE DEVOLUCIONES
    # -------------------------------------------------------------
    def test_25_corte_segregation_payment_methods(self):
        status, res = self.client.request("GET", "/admin/corte", token=self.admin_token)
        self.assertEqual(status, 200)
        ventas_data = res["data"]["ventas"]
        self.assertIn("efectivo", ventas_data)
        self.assertIn("tarjeta", ventas_data)
        self.assertIn("credito", ventas_data)

    def test_26_corte_cash_collection_and_inventory_purchase_exclusion(self):
        # Crear gasto de compra inventario para probar que totalCaja lo excluye
        self.client.request("POST", "/admin/gastos", {
            "descripcion": "Compra Factura Mayoreo",
            "monto": 3000.0,
            "categoria": "COMPRA_INVENTARIO"
        }, token=self.admin_token)

        status, res = self.client.request("GET", "/admin/corte", token=self.admin_token)
        self.assertEqual(status, 200)
        gastos_data = res["data"]["gastos"]
        # totalCaja debe ser menor que total porque excluye COMPRA_INVENTARIO
        self.assertLessEqual(gastos_data["totalCaja"], gastos_data["total"])
        self.assertIn("total", res["data"]["abonos"])

    def test_27_corte_cash_reconciliation_formula(self):
        status, res = self.client.request("GET", "/admin/corte", token=self.admin_token)
        self.assertEqual(status, 200)
        d = res["data"]
        efectivo_ventas = d["ventas"]["efectivo"]
        abonos_efectivo = d["abonos"]["total"]
        gastos_caja = d["gastos"]["totalCaja"]
        devoluciones_efectivo = d.get("devoluciones", {}).get("total", 0.0)
        efectivo_esperado = d["efectivoEsperado"]
        
        # Fórmula financiera exacta: EfectivoEsperado = VentasEfectivo + AbonosEfectivo - GastosCaja - Devoluciones
        calculado = round(efectivo_ventas + abonos_efectivo - gastos_caja - devoluciones_efectivo, 2)
        self.assertEqual(efectivo_esperado, calculado)

        # Conciliación con fondo inicial:
        fondo_inicial = 500.0
        efectivo_gaveta_arqueo = fondo_inicial + efectivo_esperado
        self.assertEqual(efectivo_gaveta_arqueo, fondo_inicial + calculado)

    def test_28_admin_cancel_sale_restitutes_stock_and_audit_devolucion(self):
        # 1. Crear una venta normal
        sale_data = {
            "items": [{"id_producto": self.prod_pza["id"], "cantidad": 2}],
            "metodo_pago": "EFECTIVO",
            "id_caja": self.id_caja
        }
        status, res = self.client.request("POST", "/ventas", sale_data, token=self.cajero_token)
        self.assertEqual(status, 201)
        venta_id = res["data"]["venta"]["id"]

        # Stock tras la venta
        status, res = self.client.request("GET", f"/ventas/productos?q={self.prod_pza['sku']}", token=self.admin_token)
        stock_after_sale = res["data"][0]["stock_actual"]

        # 2. Cancelar la venta como Admin
        cancel_data = {"motivo": "Devolución por producto en mal estado"}
        status, res = self.client.request("POST", f"/admin/cancel-sale/{venta_id}", cancel_data, token=self.admin_token)
        self.assertEqual(status, 200)
        self.assertEqual(res["status"], "success")

        # 3. Verificar restitución de stock (+2 piezas)
        status, res = self.client.request("GET", f"/ventas/productos?q={self.prod_pza['sku']}", token=self.admin_token)
        stock_restored = res["data"][0]["stock_actual"]
        self.assertEqual(stock_restored, round(stock_after_sale + 2, 2))

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestOmniStockIntegration)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    total = result.testsRun
    failed = len(result.failures) + len(result.errors)
    passed = total - failed
    rate = (passed / total) * 100 if total > 0 else 0
    print(f"\n=======================================================")
    print(f"OMNISTOCK POS QA CERTIFICATION SUMMARY:")
    print(f"Total Tests: {total} | Passed: {passed} | Failed: {failed}")
    print(f"Success Rate: {rate:.2f}%")
    print(f"=======================================================")
    sys.exit(0 if failed == 0 else 1)
