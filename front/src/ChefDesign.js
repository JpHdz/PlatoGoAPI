import React, { useState, useEffect } from "react";
import axios from "axios";
import { Eye, CheckCircle } from "lucide-react";
import "./ChefDesign.css";

const ChefDesign = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDesglose, setShowDesglose] = useState(false);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/v1/order"); // Cambiar URL según la API
        console.log("Response Data:", response.data);
        const ordersWithImages = response.data.data.data.map((order) => ({
          ...order,
          platillos: order.productos.map((producto) => ({
            ...producto,
            image: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=880`,
          })),
        }));
        setOrders(ordersWithImages);
      } catch (err) {
        setError("Error al cargar los pedidos.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Marcar platillo como terminado
  const markAsCompleted = (mesaId, platilloId) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === mesaId) {
        const updatedPlatillos = order.platillos
          .map((platillo) => {
            if (platillo.id === platilloId) {
              const completedPlatillo = {
                ...platillo,
                terminado: true,
                mesa: order.mesa,
              };
              setCompletedItems((prev) => [...prev, completedPlatillo]);
              return null; // Remover del array original
            }
            return platillo;
          })
          .filter(Boolean); // Filtrar elementos null

        return { ...order, platillos: updatedPlatillos };
      }
      return order;
    });

    setOrders(updatedOrders);
  };

  // Remover platillo completado del desglose
  const removeFromDesglose = (platilloId) => {
    setCompletedItems((prev) => prev.filter((item) => item.id !== platilloId));
  };

  if (loading) {
    return <div className="loading">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="chef-app">
      {/* Header */}
      <div className="chef-header">
        <h1>COCINERO URIEL</h1>
      </div>

      {/* Main Content */}
      <div className="chef-content">
        {orders.map((order) => (
          <div key={order.id} className="mesa-section">
            <div className="mesa-header">
              <div className="mesa-indicator"></div>
              <h2 className="mesa-title">MESA {order.mesa}</h2>
              <div className="mesa-line"></div>
            </div>

            <div className="platillos-grid">
              {order.platillos.map((platillo) => (
                <div key={platillo.id} className="platillo-card">
                  <div className="platillo-image-container">
                    <img
                      src={platillo.image}
                      alt={platillo.name}
                      className="platillo-image"
                    />
                  </div>
                  <div className="platillo-status">
                    <div className="platillo-info-row">
                      <h3 className="platillo-name">{platillo.name}</h3>
                      <p className="platillo-tiempo">{platillo.tiempo}</p>
                    </div>
                    <div className="platillo-btn-row">
                      <button
                        onClick={() => markAsCompleted(order.id, platillo.id)}
                        className="terminado-btn"
                      >
                        <CheckCircle size={16} />
                        <span>TERMINADO</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="chef-bottom-bar">
        <div className="language-selector">
          <span className="language-text">ESP</span>
          <div className="language-arrow"></div>
        </div>

        <button onClick={() => setShowDesglose(true)} className="desglose-btn">
          <Eye size={20} />
          <span>Ver desglose</span>
          {completedItems.length > 0 && (
            <span className="desglose-count">{completedItems.length}</span>
          )}
        </button>
      </div>

      {/* Desglose Overlay */}
      {showDesglose && (
        <div className="desglose-overlay">
          <div className="desglose-panel">
            <div className="desglose-header">
              <div className="desglose-header-content">
                <h2 className="desglose-title">PLATILLOS TERMINADOS</h2>
                <button
                  onClick={() => setShowDesglose(false)}
                  className="close-btn"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="desglose-content">
              {completedItems.length === 0 ? (
                <p className="empty-desglose">No hay platillos terminados</p>
              ) : (
                <>
                  {completedItems.map((item) => (
                    <div
                      key={`completed-${item.id}`}
                      className="completed-item"
                    >
                      <div className="completed-item-header">
                        <h3 className="completed-item-name">{item.name}</h3>
                        <span className="completed-mesa">Mesa {item.mesa}</span>
                        <button
                          onClick={() => removeFromDesglose(item.id)}
                          className="remove-completed-btn"
                        >
                          ×
                        </button>
                      </div>

                      <div className="completed-item-details">
                        <span className="completed-tiempo">
                          Tiempo: {item.tiempo}
                        </span>
                        <span className="completed-status">✓ Terminado</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChefDesign;
