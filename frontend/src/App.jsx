import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from "@heroui/react";
import {
  Boxes,
  LayoutDashboard,
  Menu,
  Pencil,
  Plus,
  Search,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";

const emptyForm = { name: "", description: "", quantity: "0" };

const navigation = [
  { label: "Painel", icon: LayoutDashboard },
  { label: "Estoque", icon: Boxes, active: true },
  { label: "Localizações", icon: Warehouse },
];

async function requestItems(url, options) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Não foi possível concluir a solicitação.");
  }

  return response.status === 204 ? null : response.json();
}

function SortableHeader({ label, column, sort, onSort }) {
  const isActive = sort.column === column;
  const SortIcon = !isActive
    ? ArrowUpDown
    : sort.direction === "ascending"
      ? ArrowUp
      : ArrowDown;

  return (
    <button className={`sortable-header ${isActive ? "active" : ""}`} type="button" onClick={() => onSort(column)}>
      {label}
      <SortIcon size={14} />
    </button>
  );
}

function App() {
  const [items, setItems] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState({ column: "name", direction: "ascending" });
  const [form, setForm] = useState({
    ...emptyForm,
    brand: "",
    categoryLabel: "",
    roomLocation: "",
    subItems: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const subItemSwipeStart = useRef(null);

  const loadProfiles = useCallback(async () => {
    const loadedProfiles = await requestItems("/api/users/1/environments");
    setProfiles(loadedProfiles);
    if (!activeProfileId && loadedProfiles.length > 0) {
      setActiveProfileId(String(loadedProfiles[0].id));
    }
  }, [activeProfileId]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      setError("");
      const profileQuery = activeProfileId ? `?environmentId=${activeProfileId}` : "";
      setItems(await requestItems(`/api/items${profileQuery}`));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId]);

  useEffect(() => {
    loadProfiles().catch((loadError) => setError(loadError.message));
  }, [loadProfiles]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      brand: "",
      categoryLabel: "",
      roomLocation: "",
      subItems: [],
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      brand: item.brand || "",
      categoryLabel: item.categoryLabel || "",
      roomLocation: item.roomLocation || "",
      description: item.description || "",
      quantity: String(item.quantity),
      subItems: (item.subItems || []).map((subItem) => ({
        id: subItem.id,
        sequence: subItem.sequence,
        description: subItem.description,
        quantity: String(subItem.quantity),
      })),
    });
    setError("");
    setIsModalOpen(true);
  };

  const updateSubItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      subItems: current.subItems.map((subItem, subItemIndex) =>
        subItemIndex === index ? { ...subItem, [field]: value } : subItem,
      ),
    }));
  };

  const addSubItem = () => {
    setForm((current) => ({
      ...current,
      subItems: [
        ...current.subItems,
        {
          sequence: current.subItems.length + 1,
          description: "",
          quantity: "0",
        },
      ],
    }));
  };

  const removeSubItem = (index) => {
    if (!window.confirm("Remover este subitem?")) return;
    setForm((current) => ({
      ...current,
      subItems: current.subItems
        .filter((_, subItemIndex) => subItemIndex !== index)
        .map((subItem, subItemIndex) => ({ ...subItem, sequence: subItemIndex + 1 })),
    }));
  };

  const startSubItemSwipe = (event) => {
    subItemSwipeStart.current = event.clientX;
  };

  const finishSubItemSwipe = (event, index) => {
    if (subItemSwipeStart.current !== null && subItemSwipeStart.current - event.clientX > 70) {
      removeSubItem(index);
    }
    subItemSwipeStart.current = null;
  };

  const saveItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        categoryLabel: form.categoryLabel.trim(),
        roomLocation: form.roomLocation.trim(),
        description: form.description.trim(),
        quantity: Number(form.quantity),
        environmentProfile: activeProfileId ? { id: Number(activeProfileId) } : null,
        subItems: form.subItems.map((subItem, index) => ({
          ...(subItem.id ? { id: subItem.id } : {}),
          sequence: index + 1,
          description: subItem.description.trim(),
          quantity: Number(subItem.quantity),
        })),
      };
      const url = editingId ? `/api/items/${editingId}` : "/api/items";
      await requestItems(url, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setIsModalOpen(false);
      await loadItems();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Excluir este item?")) return;

    try {
      setError("");
      await requestItems(`/api/items/${id}`, { method: "DELETE" });
      await loadItems();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleSort = (column) => {
    setSort((current) => ({
      column,
      direction:
        current.column === column && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const filteredItems = items
    .filter((item) =>
      [item.name, item.brand, item.categoryLabel, item.roomLocation, item.description].some((value) =>
        value?.toLowerCase().includes(debouncedQuery.toLowerCase()),
      ),
    )
    .sort((first, second) => {
      const firstValue = first[sort.column] ?? "";
      const secondValue = second[sort.column] ?? "";
      const comparison =
        typeof firstValue === "number" && typeof secondValue === "number"
          ? firstValue - secondValue
          : String(firstValue).localeCompare(String(secondValue), "pt-BR", {
              sensitivity: "base",
            });

      return sort.direction === "ascending" ? comparison : -comparison;
    });
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const activeProfile = profiles.find((profile) => String(profile.id) === activeProfileId);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Boxes size={20} />
          </div>
          <span className="sidebar-label">StockVision</span>
        </div>

        <nav className="sidebar-nav" aria-label="Navegação principal">
          {navigation.map(({ label, icon: Icon, active }) => (
            <button className={`nav-item ${active ? "active" : ""}`} key={label} type="button">
              <Icon size={19} strokeWidth={1.8} />
              <span className="sidebar-label">{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" type="button">
            <Menu size={19} strokeWidth={1.8} />
            <span className="sidebar-label">Configurações</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="page-header">
          <div>
            <p className="eyebrow">
              {activeProfile ? `${activeProfile.name} / Estoque` : "Área de trabalho / Estoque"}
            </p>
            <h1>Estoque</h1>
            <p className="subtitle">Mantenha seu estoque organizado e sempre atualizado.</p>
          </div>
          <select
            aria-label="Selecionar ambiente"
            className="profile-select"
            value={activeProfileId}
            onChange={(event) => setActiveProfileId(event.target.value)}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.type === "HOME" ? "Casa" : "Trabalho"})
              </option>
            ))}
          </select>
          <Button
            color="primary"
            startContent={<Plus size={18} />}
            type="button"
            onClick={openCreate}
          >
            Adicionar item
          </Button>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" aria-label="Fechar mensagem de erro" onClick={() => setError("")}>
              <X size={16} />
            </button>
          </div>
        )}đ

        <section className="stats-grid" aria-label="Resumo do estoque">
          <Card shadow="sm">
            <CardBody>
              <span className="stat-label">Total de produtos</span>
              <Chip className="stat-chip" color="primary" size="lg" variant="flat">
                {items.length} produtos
              </Chip>
            </CardBody>
          </Card>
          <Card shadow="sm">
            <CardBody>
              <span className="stat-label">Items em estoque</span>
              <Chip className="stat-chip" color="secondary" size="lg" variant="flat">
                {totalUnits} unidades
              </Chip>
            </CardBody>
          </Card>
          <Card shadow="sm">
            <CardBody>
              <span className="stat-label">Avaliação Geral</span>
              <Chip className="stat-chip" color="success" size="lg" variant="flat">
                Regular
              </Chip>
            </CardBody>
          </Card>
        </section>

        <Card className="inventory-card" shadow="sm">
          <CardHeader className="table-toolbar">
            <div>
              <h2>Todos os itens</h2>
              <p>{filteredItems.length} produtos exibidos</p>
            </div>
            <Input
              aria-label="Pesquisar no estoque"
              className="search-input"
              placeholder="Pesquisar itens..."
              startContent={<Search size={17} />}
              value={query}
              onValueChange={setQuery}
            />
          </CardHeader>
          <CardBody>
            <Table removeWrapper aria-label="Itens do estoque">
              <TableHeader>
                <TableColumn>
                  <SortableHeader label="PRODUTO" column="name" sort={sort} onSort={handleSort} />
                </TableColumn>
                <TableColumn>
                  <SortableHeader label="CATEGORIA" column="categoryLabel" sort={sort} onSort={handleSort} />
                </TableColumn>
                <TableColumn>
                  <SortableHeader label="LOCAL" column="roomLocation" sort={sort} onSort={handleSort} />
                </TableColumn>
                <TableColumn>
                  <SortableHeader label="DESCRIÇÃO" column="description" sort={sort} onSort={handleSort} />
                </TableColumn>
                <TableColumn>
                  <SortableHeader label="QUANTIDADE" column="quantity" sort={sort} onSort={handleSort} />
                </TableColumn>
                <TableColumn align="end">AÇÕES</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent={loading ? "Carregando estoque..." : "Nenhum item encontrado."}
                isLoading={loading}
                loadingContent={<Spinner label="Carregando..." />}
              >
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <span className="product-name">{item.name}</span>
                        {item.brand && <small className="product-brand">{item.brand}</small>}
                      </div>
                    </TableCell>
                    <TableCell>{item.categoryLabel || "—"}</TableCell>
                    <TableCell>{item.roomLocation || "—"}</TableCell>
                    <TableCell>{item.description || "—"}</TableCell>
                    <TableCell>
                      <Chip color={item.quantity > 0 ? "success" : "warning"} size="sm" variant="flat">
                        {item.quantity} unidades
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="row-actions">
                        <Button isIconOnly size="sm" variant="light" aria-label={`Editar ${item.name}`} onPress={() => openEdit(item)}>
                          <Pencil size={16} />
                        </Button>
                        <Button isIconOnly size="sm" variant="light" color="danger" aria-label={`Excluir ${item.name}`} onPress={() => deleteItem(item.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Modal isOpen={isModalOpen} onOpenChange={setIsModalOpen} placement="center">
          <ModalContent>
            {(onClose) => (
              <form onSubmit={saveItem}>
                <ModalHeader>{editingId ? "Editar item" : "Adicionar item"}</ModalHeader>
                <ModalBody>
                  <Input
                    isRequired
                    label="Nome"
                    placeholder="Ex.: teclado sem fio"
                    value={form.name}
                    onValueChange={(value) => setForm((current) => ({ ...current, name: value }))}
                  />
                  <Input
                    label="Marca"
                    placeholder="Opcional"
                    value={form.brand}
                    onValueChange={(value) => setForm((current) => ({ ...current, brand: value }))}
                  />
                  <Input
                    isRequired
                    label="Categoria"
                    placeholder="Ex.: Eletrônicos"
                    value={form.categoryLabel}
                    onValueChange={(value) => setForm((current) => ({ ...current, categoryLabel: value }))}
                  />
                  <Input
                    label="Cômodo ou local"
                    placeholder="Ex.: Escritório"
                    value={form.roomLocation}
                    onValueChange={(value) => setForm((current) => ({ ...current, roomLocation: value }))}
                  />
                  <Textarea
                    label="Descrição"
                    placeholder="Adicione uma breve descrição"
                    value={form.description}
                    onValueChange={(value) => setForm((current) => ({ ...current, description: value }))}
                  />
                  <Input
                    isRequired
                    label="Quantidade"
                    min="0"
                    type="number"
                    value={form.quantity}
                    onValueChange={(value) => setForm((current) => ({ ...current, quantity: value }))}
                  />
                  <div className="subitems-editor">
                    <div className="subitems-heading">
                      <div>
                        <strong>Subitens</strong>
                        <span>Opcional</span>
                      </div>
                      <Button type="button" size="sm" variant="flat" onClick={addSubItem}>
                        <Plus size={15} />
                        Adicionar
                      </Button>
                    </div>
                    {form.subItems.map((subItem, index) => (
                      <div
                        className="subitem-row"
                        key={subItem.id || `new-${index}`}
                        onPointerDown={startSubItemSwipe}
                        onPointerUp={(event) => finishSubItemSwipe(event, index)}
                        onPointerCancel={() => { subItemSwipeStart.current = null; }}
                      >
                        <span className="subitem-sequence">{index + 1}</span>
                        <Input
                          aria-label={`Descrição do subitem ${index + 1}`}
                          placeholder="Descrição"
                          value={subItem.description}
                          onValueChange={(value) => updateSubItem(index, "description", value)}
                        />
                        <Input
                          aria-label={`Quantidade do subitem ${index + 1}`}
                          min="0"
                          placeholder="Qtd."
                          type="number"
                          value={subItem.quantity}
                          onValueChange={(value) => updateSubItem(index, "quantity", value)}
                        />
                        <Button
                          isIconOnly
                          aria-label={`Remover subitem ${index + 1}`}
                          className="subitem-remove"
                          color="danger"
                          size="sm"
                          type="button"
                          variant="light"
                          onClick={() => removeSubItem(index)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>Cancelar</Button>
                  <Button color="primary" type="submit" isLoading={saving}>
                    {editingId ? "Salvar alterações" : "Criar item"}
                  </Button>
                </ModalFooter>
              </form>
            )}
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

export default App;
