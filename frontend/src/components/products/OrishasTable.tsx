"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

// Definición del tipo para Orisha (corresponde a Product Brand)
export type Orisha = {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image: {
    id: number;
    src: string;
    alt: string;
  } | null;
};

interface OrishasTableProps {
  data: Orisha[];
  onDelete: (id: number) => Promise<void>;
}

export function OrishasTable({ data, onDelete }: OrishasTableProps) {
  const router = useRouter();

  const handleEdit = (id: number) => {
    router.push(`/dashboard/products/orishas/${id}/edit`);
  };

  const columns: ColumnDef<Orisha>[] = [
    {
      id: "image",
      header: "",
      cell: ({ row }) => (
        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
          {row.original.image ? (
            <img src={row.original.image.src} alt={row.original.name} className="w-full h-full object-cover rounded-md" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div>
          <div className="font-bold">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">Slug: {row.original.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <div 
          className="text-sm text-muted-foreground max-w-xs truncate"
          dangerouslySetInnerHTML={{ __html: row.getValue("description") }}
        />
      ),
    },
    {
      accessorKey: "count",
      header: "Productos",
      cell: ({ row }) => <div>{row.getValue("count")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const orisha = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(orisha.id)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(orisha.id)}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No hay resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 