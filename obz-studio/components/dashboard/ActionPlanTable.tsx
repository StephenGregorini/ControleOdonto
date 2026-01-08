import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import DetailDrawer from "@/components/ui/DetailDrawer";
import { actionPlanData, type ActionItem } from "@/data/action-plan-data";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { Pencil, Plus, Trash2 } from "lucide-react";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const getStatusBadgeVariant = (status: ActionItem["status"]) => {
  switch (status) {
    case "Concluído":
      return "success";
    case "Em Andamento":
      return "secondary";
    case "Atrasado":
      return "destructive";
    case "Pendente":
    default:
      return "outline";
  }
};

const ActionPlanTable: React.FC = () => {
  const [actions, setActions] = useLocalStorageState<ActionItem[]>(
    "obz.action-plan.v1",
    actionPlanData
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);

  const startNewAction = () => {
    setEditingAction({
      id: "",
      acao: "",
      macroEtapa: "",
      responsavel: "",
      prazo: "",
      status: "Pendente",
      impactoEstimado: 0,
      vinculoIndicador: "",
      vinculoContrato: "",
    });
    setDrawerOpen(true);
  };

  const startEditAction = (item: ActionItem) => {
    setEditingAction({ ...item });
    setDrawerOpen(true);
  };

  const handleDelete = (actionId: string) => {
    const confirmDelete = window.confirm("Deseja excluir esta acao?");
    if (!confirmDelete) return;
    setActions((prev) => prev.filter((item) => item.id !== actionId));
  };

  const handleSave = () => {
    if (!editingAction) return;
    const id = editingAction.id.trim() || `A${Date.now().toString().slice(-5)}`;
    const payload: ActionItem = {
      ...editingAction,
      id,
      impactoEstimado: Number(editingAction.impactoEstimado) || 0,
      vinculoIndicador: editingAction.vinculoIndicador || undefined,
      vinculoContrato: editingAction.vinculoContrato || undefined,
    };

    setActions((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (exists) {
        return prev.map((item) => (item.id === id ? payload : item));
      }
      return [payload, ...prev];
    });

    setDrawerOpen(false);
    setEditingAction(null);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Plano de Acao Estruturado</CardTitle>
          <CardDescription>Macro etapas, responsaveis e impacto estimado</CardDescription>
        </div>
        <button
          type="button"
          onClick={startNewAction}
          className="inline-flex items-center gap-2 rounded-full border bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          Nova acao
        </button>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border bg-card/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acao</TableHead>
                <TableHead>Macro Etapa</TableHead>
                <TableHead>Responsavel</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Impacto Estimado</TableHead>
                <TableHead>Vinculo</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((item: ActionItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.acao}</TableCell>
                  <TableCell>{item.macroEtapa}</TableCell>
                  <TableCell>{item.responsavel}</TableCell>
                  <TableCell>{item.prazo}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.impactoEstimado)}
                  </TableCell>
                  <TableCell>
                    {item.vinculoIndicador ? (
                      <Badge variant="outline">{item.vinculoIndicador}</Badge>
                    ) : null}
                    {item.vinculoContrato ? (
                      <Badge variant="outline">{item.vinculoContrato}</Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => startEditAction(item)}
                        className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-full border bg-card p-2 text-muted-foreground hover:text-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {actions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                    Nenhuma acao cadastrada.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <DetailDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingAction(null);
        }}
        title={editingAction?.id ? "Editar acao" : "Nova acao"}
        subtitle="Cadastro rapido sem backend (salvo localmente)"
      >
        {editingAction ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Acao
                </label>
                <Input
                  value={editingAction.acao}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, acao: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: Revisar contrato de OPME"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Macro etapa
                </label>
                <Input
                  value={editingAction.macroEtapa}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, macroEtapa: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: Negociacao"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Responsavel
                </label>
                <Input
                  value={editingAction.responsavel}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, responsavel: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: Gerente Suprimentos"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Prazo
                </label>
                <Input
                  type="date"
                  value={editingAction.prazo}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, prazo: event.target.value } : prev
                    )
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </label>
                <select
                  value={editingAction.status}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, status: event.target.value as ActionItem["status"] } : prev
                    )
                  }
                  className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluido</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Impacto estimado (R$)
                </label>
                <Input
                  type="number"
                  value={editingAction.impactoEstimado}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, impactoEstimado: Number(event.target.value) } : prev
                    )
                  }
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vinculo indicador
                </label>
                <Input
                  value={editingAction.vinculoIndicador ?? ""}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, vinculoIndicador: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: Gasto assistencial"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vinculo contrato
                </label>
                <Input
                  value={editingAction.vinculoContrato ?? ""}
                  onChange={(event) =>
                    setEditingAction((prev) =>
                      prev ? { ...prev, vinculoContrato: event.target.value } : prev
                    )
                  }
                  placeholder="Ex: C001"
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setEditingAction(null);
                }}
                className="rounded-full border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-full border bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
              >
                Salvar acao
              </button>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </Card>
  );
};

export default ActionPlanTable;
