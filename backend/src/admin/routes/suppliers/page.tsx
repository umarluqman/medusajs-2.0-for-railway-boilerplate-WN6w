import {
  Table,
  Textarea,
  Text,
  Container,
  Heading,
  Button,
  Drawer,
  Input,
  IconButton,
} from "@medusajs/ui";
import { useEffect, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ArchiveBox, Pencil, Trash } from "@medusajs/icons";

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Record<string, string>[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    fetch(`/admin/suppliers`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(({ suppliers: suppliersData }) => {
        setSuppliers(suppliersData);
      });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/admin/suppliers", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create supplier");
      }

      const { supplier } = await response.json();
      setSuppliers((prev) => [...prev, supplier]);
      setFormData({
        id: "",
        name: "",
        address: "",
        phone: "",
        email: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating supplier:", error);
      // You might want to show an error notification here
    }
  };

  const handleEdit = async () => {
    // Use editingSupplier.id instead of formData.id
    console.log("Editing supplier ID:", editingSupplier.id);
    try {
      const response = await fetch(`/admin/suppliers/${editingSupplier.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update supplier");
      }

      const { supplier } = await response.json();
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplier.id ? supplier : s))
      );
      setEditingSupplier(null);
      setFormData({
        id: "",
        name: "",
        address: "",
        phone: "",
        email: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating supplier:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      const response = await fetch(`/admin/suppliers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete supplier");
      }

      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting supplier:", error);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Suppliers</Heading>
        <Button variant="secondary" onClick={() => setIsOpen(true)}>
          Add Supplier
        </Button>
      </div>
      <div className="flex h-full flex-col overflow-hidden !border-t-0">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Contact Number</Table.HeaderCell>
              <Table.HeaderCell>Address</Table.HeaderCell>
              <Table.HeaderCell>Actions</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {suppliers.map((supplier) => (
              <Table.Row key={supplier.id}>
                <Table.Cell>{supplier.name}</Table.Cell>
                <Table.Cell>{supplier.email}</Table.Cell>
                <Table.Cell>{supplier.phone}</Table.Cell>
                <Table.Cell>{supplier.address}</Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2">
                    <IconButton
                      variant="primary"
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setFormData({
                          id: supplier.id,
                          name: supplier.name,
                          address: supplier.address,
                          phone: supplier.phone,
                          email: supplier.email,
                        });
                        setIsOpen(true);
                      }}
                    >
                      <Pencil />
                    </IconButton>
                    <IconButton
                      variant="primary"
                      onClick={() => handleDelete(supplier.id)}
                    >
                      <Trash />
                    </IconButton>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Add Supplier</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form className="flex flex-col gap-y-4">
              <div>
                <Text className="mb-2">Supplier Name</Text>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full rounded-md border border-ui-border-base p-2"
                />
              </div>
              <div>
                <Text className="mb-2">Address</Text>
                <Textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              <div>
                <Text className="mb-2">Phone Number</Text>
                <Input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full rounded-md border border-ui-border-base p-2"
                />
              </div>
              <div>
                <Text className="mb-2">Email</Text>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full rounded-md border border-ui-border-base p-2"
                />
              </div>
            </form>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setIsOpen(false);
                setEditingSupplier(null);
                setFormData({
                  id: "",
                  name: "",
                  address: "",
                  phone: "",
                  email: "",
                });
              }}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button onClick={editingSupplier ? handleEdit : handleSubmit}>
              {editingSupplier ? "Update" : "Save"} Changes
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  );
};

export default SuppliersPage;

export const config = defineRouteConfig({
  label: "Suppliers",
  icon: ArchiveBox,
});
