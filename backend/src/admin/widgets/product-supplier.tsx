import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/types";
import { useEffect, useState } from "react";
import {
  Button,
  Container,
  Drawer,
  DropdownMenu,
  Heading,
  IconButton,
  Select,
  Text,
} from "@medusajs/ui";
import { EllipsisHorizontal, PencilSquare, Plus, Trash } from "@medusajs/icons";

const ProductSupplierWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [supplier, setSupplier] = useState<
    Record<string, string> | undefined
  >();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Record<string, string>[]>([]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    fetch(`/admin/products/${data.id}?fields=+supplier.*`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(({ product }) => {
        setSupplier(product.supplier);
        setLoading(false);
      });
  }, [loading]);

  useEffect(() => {
    fetch(`/admin/suppliers`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(({ suppliers }) => {
        setSuppliers(suppliers);
      });
  }, []);

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
            <Drawer>
              <Drawer.Trigger asChild>
                <DropdownMenu.Item
                  className="gap-x-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  <div className="flex items-center gap-x-2">
                    <PencilSquare className="text-ui-fg-subtle" />
                    <span>Edit</span>
                  </div>
                </DropdownMenu.Item>
              </Drawer.Trigger>
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>Edit Variant</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body className="p-4">
                  <div className="flex flex-col gap-y-4">
                    <Select>
                      <Select.Trigger>
                        <Select.Value placeholder="Select a supplier" />
                      </Select.Trigger>
                      <Select.Content>
                        {suppliers.map((item) => (
                          <Select.Item key={item.value} value={item.value}>
                            {item.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>

                    {/* <Select
                        // className="txt-compact-medium h-10 w-full rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2"
                        defaultValue={supplier?.id}
                      >
                        <option value="">Select a supplier</option>
                        {suppliers.map((sup) => (
                          <option key={sup.id} value={sup.id}>
                            {sup.name}
                          </option>
                        ))}
                      </Select> */}
                  </div>
                </Drawer.Body>
                <Drawer.Footer>
                  <Drawer.Close asChild>
                    <Button variant="secondary">Cancel</Button>
                  </Drawer.Close>
                  <Button>Assign Supplier</Button>
                </Drawer.Footer>
              </Drawer.Content>
            </Drawer>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      {supplier && <span>{supplier.name}</span>}
      {supplier && <span>{supplier.email}</span>}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
});

export default ProductSupplierWidget;
