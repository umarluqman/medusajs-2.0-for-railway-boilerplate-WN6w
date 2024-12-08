import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/types";
import { useEffect, useState } from "react";
import {
  Button,
  Container,
  Drawer,
  DropdownMenu,
  IconButton,
  Select,
  Heading,
  Input,
  Text,
} from "@medusajs/ui";
import { EllipsisHorizontal, PencilSquare } from "@medusajs/icons";

type SupplierData = {
  id: string;
  name: string;
  email?: string;
  supply_price?: number;
  minimum_order_quantity?: number;
};

const ProductSupplierWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [supplier, setSupplier] = useState<SupplierData | undefined>();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Record<string, string>[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [supplyPrice, setSupplyPrice] = useState<string>("");
  const [minOrderQty, setMinOrderQty] = useState<string>("");

  useEffect(() => {
    if (!loading) return;

    fetch(`/admin/products/${data.id}?fields=+supplier.*,+product_supplier.*`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(({ product }) => {
        if (product.supplier) {
          setSupplier({
            ...product.supplier,
            supply_price: product.product_supplier?.supply_price,
            minimum_order_quantity:
              product.product_supplier?.minimum_order_quantity,
          });
          setSupplyPrice(
            product.product_supplier?.supply_price?.toString() || ""
          );
          setMinOrderQty(
            product.product_supplier?.minimum_order_quantity?.toString() || ""
          );
        }
        setLoading(false);
      });
  }, [loading]);

  const fetchSuppliers = async () => {
    const response = await fetch(`/admin/suppliers`, {
      credentials: "include",
    });
    const { suppliers } = await response.json();
    setSuppliers(suppliers);
  };

  const handleDrawerOpen = () => {
    setIsDrawerOpen(true);
    fetchSuppliers();
  };

  const handleAssignSupplier = async () => {
    if (!selectedSupplierId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/admin/products/${data.id}/supplier`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplier_id: selectedSupplierId,
          supply_price: supplyPrice ? parseFloat(supplyPrice) : null,
          minimum_order_quantity: minOrderQty ? parseInt(minOrderQty) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign supplier");
      }

      setLoading(true);
      setIsDrawerOpen(false);
      setSelectedSupplierId("");
      setSupplyPrice("");
      setMinOrderQty("");
    } catch (error) {
      console.error("Error assigning supplier:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Supplier</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <IconButton variant="transparent" size="small">
              <EllipsisHorizontal />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              className="gap-x-2"
              onSelect={(e) => {
                e.preventDefault();
                handleDrawerOpen();
              }}
            >
              <div className="flex items-center gap-x-2">
                <PencilSquare className="text-ui-fg-subtle" />
                <span>Edit</span>
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      {supplier && (
        <div className="px-6 py-4">
          <span>{supplier.name}</span>
          {supplier.email && (
            <span className="block text-ui-fg-subtle">{supplier.email}</span>
          )}
          {supplier.supply_price && (
            <span className="block text-ui-fg-subtle">
              Supply Price: {supplier.supply_price}
            </span>
          )}
          {supplier.minimum_order_quantity && (
            <span className="block text-ui-fg-subtle">
              Min Order Qty: {supplier.minimum_order_quantity}
            </span>
          )}
        </div>
      )}

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Assign Supplier</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 p-4">
            <div>
              <Text className="mb-2">Select Supplier</Text>
              <Select
                value={selectedSupplierId}
                onValueChange={setSelectedSupplierId}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select a supplier" />
                </Select.Trigger>
                <Select.Content>
                  {suppliers.map((supplier) => (
                    <Select.Item key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            <div>
              <Text className="mb-2">Supply Price</Text>
              <Input
                type="number"
                step="0.01"
                value={supplyPrice}
                onChange={(e) => setSupplyPrice(e.target.value)}
                placeholder="Enter supply price"
              />
            </div>

            <div>
              <Text className="mb-2">Minimum Order Quantity</Text>
              <Input
                type="number"
                value={minOrderQty}
                onChange={(e) => setMinOrderQty(e.target.value)}
                placeholder="Enter minimum order quantity"
              />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Drawer.Close asChild>
              <Button variant="secondary">Cancel</Button>
            </Drawer.Close>
            <Button
              onClick={handleAssignSupplier}
              isLoading={isUpdating}
              disabled={!selectedSupplierId || isUpdating}
            >
              Assign Supplier
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});

export default ProductSupplierWidget;
