from .models import Barcode, Unit


def generate_barcode_name(unit):
    """
    Return the next barcode name for the unit's prefix, e.g. "PTYD-0000001".

    Must be called inside transaction.atomic(): the select_for_update lock
    on the Unit row serializes number generation per unit, so two
    concurrent requests cannot produce the same number. The unique
    constraint on Barcode.name is the final safety net.
    """
    locked_unit = Unit.objects.select_for_update().get(pk=unit.pk)
    prefix = locked_unit.barcode_prefix

    last_name = (
        Barcode.objects
        .filter(name__startswith=f"{prefix}-")
        .order_by("-name")  # names are zero-padded, so text order == numeric order
        .values_list("name", flat=True)
        .first()
    )
    last_number = int(last_name.rsplit("-", 1)[1]) if last_name else 0

    return f"{prefix}-{last_number + 1:07d}"
