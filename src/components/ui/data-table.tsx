import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import React from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  headerClassName?: string;
}

export function DataTable<T>({ data, columns, headerClassName }: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum dado encontrado.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader className={cn(headerClassName)}>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={cn(column.className)}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={String(column.key)} className={cn(column.className)}>
                  {column.render
                    ? column.render(item)
                    : (item as any)[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}