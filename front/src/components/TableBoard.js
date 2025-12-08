import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import useSocket from "../hooks/useSocket";
import axios from "axios";

const TableBoard = ({ restaurantId, waiterId }) => {
  const [tables, setTables] = useState([]);
  const [activeOrders, setActiveOrders] = useState({});
  const [waiterStats, setWaiterStats] = useState({ ordersServed: 0, totalSales: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedTable, setExpandedTable] = useState(null);

  // Manejadores de eventos WebSocket
  const eventHandlers = useMemo(
    () => ({
      mesaTransferida: (data) => {
        console.log("🔄 Mesa transferida:", data);
        fetchTables();
      },
      mesaEstadoActualizado: (data) => {
        console.log("🔄 Estado de mesa actualizado:", data);
        setTables((prev) =>
          prev.map((table) =>
            table._id === data.mesaId
              ? { ...table, estado: data.estado }
              : table
          )
        );
      },
      orderStatusChanged: (order) => {
        console.log("🔄 Estado de orden actualizado:", order);
        if (order.table) {
          setActiveOrders((prev) => ({
            ...prev,
            [order.table]: (prev[order.table] || []).map((o) =>
              o._id === order._id ? order : o
            ),
          }));
        }
      },
      pedido_nuevo: (order) => {
        console.log("🆕 Nueva orden recibida:", order);
        if (order.table) {
          setActiveOrders((prev) => ({
            ...prev,
            [order.table]: [...(prev[order.table] || []), order],
          }));
        }
      },
      pedido_actualizado: (order) => {
        console.log("🔄 Orden actualizada:", order);
        if (order.table) {
          setActiveOrders((prev) => ({
            ...prev,
            [order.table]: (prev[order.table] || []).map((o) =>
              o._id === order._id ? order : o
            ),
          }));
        }
      },
      joinedRestaurant: (data) => {
        console.log("✅ Unido al canal del restaurante:", data);
        fetchTables();
      },
      joinedWaiter: (data) => {
        console.log("✅ Unido al canal del mesero:", data);
      },
    }),
    []
  );

  // Usar el hook de socket con reconexión automática
  const { connected, reconnecting, error } = useSocket({
    restaurantId,
    waiterId,
    isKitchen: false,
    eventHandlers,
  });

  // Obtener mesas
  const fetchTables = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/table", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📋 Respuesta de mesas:", response.data);
      const tablesData = response.data.data.tables || [];
      setTables(tablesData);

      // Cargar órdenes activas para cada mesa
      tablesData.forEach((table) => {
        fetchActiveOrdersForTable(table._id);
      });
    } catch (err) {
      console.error("Error al obtener mesas:", err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener estadísticas del mesero
  const fetchWaiterStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/order/stats/${waiterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("📋 Estadísticas del mesero:", response.data);
      setWaiterStats(response.data.data);
    } catch (err) {
      console.error("Error al obtener estadísticas del mesero:", err);
      setWaiterStats({ ordersServed: 0, totalSales: 0 });
    }
  };

  // Obtener órdenes activas para una mesa específica
  const fetchActiveOrdersForTable = async (tableId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/order/active-by-table/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`📋 Órdenes activas para mesa ${tableId}:`, response.data);

      setActiveOrders((prev) => ({
        ...prev,
        [tableId]: response.data.data.orders || [],
      }));
    } catch (err) {
      console.error(`Error al obtener órdenes para mesa ${tableId}:`, err);
      setActiveOrders((prev) => ({
        ...prev,
        [tableId]: [],
      }));
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    console.log("🚀 TableBoard montado");
    console.log("📍 restaurantId:", restaurantId);
    console.log("👤 waiterId:", waiterId);
    fetchTables();
    fetchWaiterStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, waiterId]);

  // Recargar datos cuando el componente vuelva a estar visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Dashboard visible de nuevo, recargando datos...");
        fetchTables();
      }
    };

    const handleFocus = () => {
      console.log("🔄 Ventana enfocada, recargando datos...");
      fetchTables();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cambiar estado de mesa
  const changeTableState = async (tableId, newState) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/table/${tableId}/state`,
        { estado: newState },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`✅ Estado de mesa actualizado a: ${newState}`);
      fetchTables();
    } catch (err) {
      console.error("Error al cambiar estado de mesa:", err);
      alert("Error al cambiar el estado de la mesa");
    }
  };

  // Obtener color según estado de mesa
  const getTableColor = (estado) => {
    switch (estado) {
      case "libre":
        return "#d4edda";
      case "ocupada":
        return "#fff3cd";
      case "cuenta":
        return "#cce5ff";
      default:
        return "#f8f9fa";
    }
  };

  // Obtener icono según estado de mesa
  const getTableIcon = (estado) => {
    switch (estado) {
      case "libre":
        return "✅";
      case "ocupada":
        return "🍽️";
      case "cuenta":
        return "💰";
      default:
        return "❓";
    }
  };

  // Obtener color según estado de orden
  const getOrderColor = (estado) => {
    switch (estado) {
      case "pending":
        return "#f8f9fa";
      case "confirmed":
        return "#e7f3ff";
      case "preparing":
        return "#fff3cd";
      case "ready":
        return "#d4edda";
      case "delivered":
        return "#cce5ff";
      case "cancelled":
        return "#f8d7da";
      default:
        return "#f8f9fa";
    }
  };

  // Obtener etiqueta de estado de orden
  const getOrderStatusLabel = (estado) => {
    const labels = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      preparing: "Preparando",
      ready: "Lista",
      delivered: "Entregada",
      cancelled: "Cancelada",
    };
    return labels[estado] || estado;
  };

  // Indicador de conexión
  const ConnectionStatus = () => {
    if (reconnecting) {
      return (
        <div
          style={{
            padding: "10px",
            background: "#fff3cd",
            color: "#856404",
            borderRadius: "4px",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>🔄</span>
          <span>Reconectando...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div
          style={{
            padding: "10px",
            background: "#f8d7da",
            color: "#721c24",
            borderRadius: "4px",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span>❌</span>
          <span>Error: {error}</span>
        </div>
      );
    }
    return (
      <div
        style={{
          padding: "10px",
          background: connected ? "#d4edda" : "#f8d7da",
          color: connected ? "#155724" : "#721c24",
          borderRadius: "4px",
          marginBottom: "15px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>{connected ? "✅" : "❌"}</span>
        <span>{connected ? "Conectado en tiempo real" : "Desconectado"}</span>
      </div>
    );
  };

  // Filtrar mesas asignadas al mesero
  const myTables = tables.filter(
    (table) => String(table.assignedWaiter) === String(waiterId)
  );

  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h2>Cargando tablero...</h2>
        <p>Obteniendo información de mesas y pedidos...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>📊 Tablero de Mesero</h2>
      <ConnectionStatus />

      {/* Sección de Estadísticas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div
          style={{
            padding: "15px",
            background: "#d4edda",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #c3e6cb",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {myTables.filter((t) => t.estado === "libre").length}
          </div>
          <div style={{ fontSize: "12px", color: "#155724" }}>Mesas Libres</div>
        </div>
        <div
          style={{
            padding: "15px",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffeeba",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {myTables.filter((t) => t.estado === "ocupada").length}
          </div>
          <div style={{ fontSize: "12px", color: "#856404" }}>
            Mesas Ocupadas
          </div>
        </div>
        <div
          style={{
            padding: "15px",
            background: "#cce5ff",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #b6d4fe",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {myTables.filter((t) => t.estado === "cuenta").length}
          </div>
          <div style={{ fontSize: "12px", color: "#004085" }}>Pidiendo Cuenta</div>
        </div>
        <div
          style={{
            padding: "15px",
            background: "#e2e3e5",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #d3d3d5",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {Object.values(activeOrders).flat().length}
          </div>
          <div style={{ fontSize: "12px", color: "#383d41" }}>
            Órdenes Activas
          </div>
        </div>
        <div
          style={{
            padding: "15px",
            background: "#d1ecf1",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #bee5eb",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            {waiterStats.ordersServed}
          </div>
          <div style={{ fontSize: "12px", color: "#0c5460" }}>
            Pedidos Atendidos (Hoy)
          </div>
        </div>
        <div
          style={{
            padding: "15px",
            background: "#f0f8ff",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #c8e1ff",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>
            ${waiterStats.totalSales.toFixed(2)}
          </div>
          <div style={{ fontSize: "12px", color: "#004085" }}>
            Ventas Totales (Hoy)
          </div>
        </div>
      </div>

      {/* Sección de Acciones Rápidas */}
      <div
        style={{
          marginBottom: "30px",
          padding: "15px",
          background: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h3>Acciones Rápidas</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              fetchTables();
              fetchWaiterStats();
            }}
            style={{
              padding: "10px 20px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#5a6268")}
            onMouseOut={(e) => (e.target.style.background = "#6c757d")}
          >
            🔄 Refrescar
          </button>
          <Link
            to="/client" // Ruta al diseño de cliente (Mesa por defecto)
            style={{
              padding: "10px 20px",
              background: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#1e7e34")}
            onMouseOut={(e) => (e.target.style.background = "#28a745")}
          >
            📝 Tomar Pedido (General)
          </Link>
          <Link
            to="/order-management" // Asumiendo que esta es la ruta para "Editar Pedido"
            style={{
              padding: "10px 20px",
              background: "#ffc107",
              color: "#000",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#e0a800")}
            onMouseOut={(e) => (e.target.style.background = "#ffc107")}
          >
            ✏️ Editar Pedido
          </Link>
          <Link
            to="/shift-management" // Asumiendo que esta es la ruta para "Traspasar Mesa" (o una sección dentro)
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#0056b3")}
            onMouseOut={(e) => (e.target.style.background = "#007bff")}
          >
            🔄 Traspasar Mesa
          </Link>
          <Link
            to="/send-to-kitchen"
            style={{
              padding: "10px 20px",
              background: "#17a2b8",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontWeight: "bold",
              transition: "background 0.3s",
            }}
            onMouseOver={(e) => (e.target.style.background = "#117a8b")}
            onMouseOut={(e) => (e.target.style.background = "#17a2b8")}
          >
            🍳 Enviar a Cocina
          </Link>
        </div>
      </div>

      {/* Sección de Mesas */}
      <div>
        <h3>Mis Mesas Asignadas ({myTables.length})</h3>

        {myTables.length === 0 ? (
          <div
            style={{
              padding: "20px",
              background: "#d1ecf1",
              borderRadius: "8px",
              border: "1px solid #bee5eb",
              color: "#0c5460",
            }}
          >
            <p>ℹ️ No tienes mesas asignadas actualmente.</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {myTables.map((table) => {
              const tableOrders = activeOrders[table._id] || [];
              const isExpanded = expandedTable === table._id;

              return (
                <div
                  key={table._id}
                  style={{
                    border: "2px solid #dee2e6",
                    borderRadius: "8px",
                    overflow: "hidden",
                    backgroundColor: getTableColor(table.estado),
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  {/* Encabezado de la mesa */}
                  <div
                    style={{
                      padding: "15px",
                      borderBottom: "1px solid rgba(0,0,0,0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          marginBottom: "5px",
                        }}
                      >
                        {getTableIcon(table.estado)} Mesa {table.numero}
                      </div>
                      <div style={{ fontSize: "12px", color: "#666" }}>
                        Capacidad: {table.capacidad} personas
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        padding: "5px 10px",
                        background: "rgba(0,0,0,0.1)",
                        borderRadius: "4px",
                      }}
                    >
                      {table.estado.toUpperCase()}
                    </div>
                  </div>

                  {/* Sección de órdenes activas */}
                  {tableOrders.length > 0 && (
                    <div style={{ padding: "15px", borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "bold",
                          marginBottom: "10px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>📦 Órdenes Activas ({tableOrders.length})</span>
                        <button
                          onClick={() =>
                            setExpandedTable(
                              isExpanded ? null : table._id
                            )
                          }
                          style={{
                            padding: "4px 8px",
                            fontSize: "12px",
                            background: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          {isExpanded ? "Ocultar" : "Ver"}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {tableOrders.map((order) => (
                            <Link
                              key={order._id}
                              to={`/order-management?orderId=${order._id}`}
                              style={{
                                padding: "10px",
                                background: getOrderColor(order.estado),
                                border: "1px solid #dee2e6",
                                borderRadius: "4px",
                                textDecoration: "none",
                                color: "#000",
                                fontSize: "12px",
                                transition: "background 0.2s",
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = "#e7f3ff";
                                e.currentTarget.style.textDecoration = "underline";
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = getOrderColor(order.estado);
                                e.currentTarget.style.textDecoration = "none";
                              }}
                            >
                              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                                Orden {order._id.substring(0, 8).toUpperCase()}
                              </div>
                              <div>
                                Estado: <strong>{getOrderStatusLabel(order.estado)}</strong>
                              </div>
                              <div>
                                Artículos: {order.productos?.length || 0}
                              </div>
                              <div>
                                Total: ${order.total?.toFixed(2) || "0.00"}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {tableOrders.length === 0 && (
                    <div
                      style={{
                        padding: "15px",
                        borderBottom: "1px solid rgba(0,0,0,0.1)",
                        fontSize: "12px",
                        color: "#666",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px"
                      }}
                    >
                      <span>Sin órdenes activas</span>
                      <Link
                        to={`/client?tableId=${table._id}`}
                        style={{
                          padding: "6px 12px",
                          background: "#28a745",
                          color: "white",
                          textDecoration: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          display: "inline-block",
                          alignSelf: "center"
                        }}
                      >
                        📝 Tomar Pedido
                      </Link>
                    </div>
                  )}

                  {/* Botones de estado */}
                  <div
                    style={{
                      padding: "15px",
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => changeTableState(table._id, "libre")}
                      disabled={table.estado === "libre"}
                      style={{
                        flex: 1,
                        minWidth: "70px",
                        padding: "8px 12px",
                        background:
                          table.estado === "libre" ? "#ccc" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          table.estado === "libre" ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) => {
                        if (table.estado !== "libre") {
                          e.target.style.background = "#1e7e34";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (table.estado !== "libre") {
                          e.target.style.background = "#28a745";
                        }
                      }}
                    >
                      ✅ Libre
                    </button>
                    <button
                      onClick={() => changeTableState(table._id, "ocupada")}
                      disabled={table.estado === "ocupada"}
                      style={{
                        flex: 1,
                        minWidth: "70px",
                        padding: "8px 12px",
                        background:
                          table.estado === "ocupada" ? "#ccc" : "#ffc107",
                        color: table.estado === "ocupada" ? "#666" : "#000",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          table.estado === "ocupada" ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) => {
                        if (table.estado !== "ocupada") {
                          e.target.style.background = "#e0a800";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (table.estado !== "ocupada") {
                          e.target.style.background = "#ffc107";
                        }
                      }}
                    >
                      🍽️ Ocupada
                    </button>
                    <button
                      onClick={() => changeTableState(table._id, "cuenta")}
                      disabled={table.estado === "cuenta"}
                      style={{
                        flex: 1,
                        minWidth: "70px",
                        padding: "8px 12px",
                        background:
                          table.estado === "cuenta" ? "#ccc" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          table.estado === "cuenta" ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "bold",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) => {
                        if (table.estado !== "cuenta") {
                          e.target.style.background = "#0056b3";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (table.estado !== "cuenta") {
                          e.target.style.background = "#007bff";
                        }
                      }}
                    >
                      💰 Cuenta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TableBoard;
