import { CustomersTable } from "@/components/customers/CustomersTable";

export default function AllCustomersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gestiona los clientes de tu tienda.
        </p>
      </div>
      
      <CustomersTable />
    </div>
  );
} 