from django.contrib.auth.models import User
from django.db import transaction
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import Barcode, Unit
from .services import generate_barcode_name


class GenerateBarcodeNameTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("tester")
        self.unit = Unit.objects.create(
            name="Proje Tasdik", barcode_prefix="PTYD", fields=["Ada", "Parsel"]
        )

    def create_barcode(self, name):
        return Barcode.objects.create(name=name, unit=self.unit, created_by=self.user)

    def test_first_number_is_one(self):
        with transaction.atomic():
            self.assertEqual(generate_barcode_name(self.unit), "PTYD-0000001")

    def test_increments_highest_existing_number(self):
        self.create_barcode("PTYD-0000004")
        self.create_barcode("PTYD-0000007")
        with transaction.atomic():
            self.assertEqual(generate_barcode_name(self.unit), "PTYD-0000008")

    def test_each_prefix_counts_independently(self):
        self.create_barcode("PTYD-0000003")
        other = Unit.objects.create(name="Kimlik Yönetimi", barcode_prefix="KYS", fields=[])
        with transaction.atomic():
            self.assertEqual(generate_barcode_name(other), "KYS-0000001")


class BarcodeApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("kubra", password="test1234")
        self.unit = Unit.objects.create(
            name="Proje Tasdik", barcode_prefix="PTYD", fields=["Ada", "Parsel"]
        )
        self.client.force_authenticate(self.user)

    def create_barcode(self):
        response = self.client.post(
            "/api/barcodes/",
            {"unit_id": self.unit.pk, "field_values": {"Ada": "4", "Parsel": "238"}},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        return response.data

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/barcodes/")
        self.assertEqual(response.status_code, 401)

    def test_token_endpoint_returns_jwt_pair(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/token/", {"username": "kubra", "password": "test1234"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_create_generates_sequential_names(self):
        first = self.create_barcode()
        second = self.create_barcode()
        self.assertEqual(first["name"], "PTYD-0000001")
        self.assertEqual(second["name"], "PTYD-0000002")
        self.assertEqual(first["created_by"], "kubra")

    def test_client_cannot_choose_name_or_created_by(self):
        other = User.objects.create_user("other")
        response = self.client.post(
            "/api/barcodes/",
            {
                "unit_id": self.unit.pk,
                "field_values": {},
                "name": "PTYD-9999999",
                "created_by": other.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "PTYD-0000001")
        self.assertEqual(response.data["created_by"], "kubra")

    def test_delete_only_deactivates(self):
        data = self.create_barcode()
        response = self.client.delete(f"/api/barcodes/{data['id']}/")
        self.assertEqual(response.status_code, 204)
        barcode = Barcode.objects.get(pk=data["id"])  # row must still exist
        self.assertFalse(barcode.is_active)
        self.assertEqual(barcode.updated_by, self.user)

    def test_list_hides_inactive_unless_requested(self):
        first = self.create_barcode()
        self.create_barcode()
        self.client.patch(
            f"/api/barcodes/{first['id']}/", {"is_active": False}, format="json"
        )
        default_list = self.client.get("/api/barcodes/")
        self.assertEqual(len(default_list.data), 1)
        full_list = self.client.get("/api/barcodes/?include_inactive=true")
        self.assertEqual(len(full_list.data), 2)


class UnitApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("kubra", password="test1234")
        self.client.force_authenticate(self.user)

    def test_prefix_is_uppercased(self):
        response = self.client.post(
            "/api/units/",
            {"name": "İmar Şefliği", "barcode_prefix": "imar", "fields": []},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["barcode_prefix"], "IMAR")

    def test_empty_fields_list_is_allowed(self):
        response = self.client.post(
            "/api/units/",
            {"name": "Evrak Kayıt", "barcode_prefix": "EVR", "fields": []},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["fields"], [])

    def test_delete_is_not_allowed(self):
        unit = Unit.objects.create(name="Silinemez", barcode_prefix="SLN", fields=[])
        response = self.client.delete(f"/api/units/{unit.pk}/")
        self.assertEqual(response.status_code, 405)
