
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import "./ClientDesign.css";

// Lista de imágenes de comida para asignar dinámicamente
const foodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=880",
  "https://plus.unsplash.com/premium_photo-1675252369719-dd52bc69c3df?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=687",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170",
  "https://images.unsplash.com/photo-1484723091739-30a097e8f929?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=749",
];

const ClientDesign = () => {
  // Estado para productos
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [tableName, setTableName] = useState("MESA");

  useEffect(() => {
    const fetchContext = async () => {
      try {
        // Get tableId from URL
        const params = new URLSearchParams(window.location.search);
        const urlTableId = params.get("tableId");

        // Fetch restaurants
        const resRest = await axios.get("/restaurant");
        const restaurants = resRest?.data?.data?.data || resRest?.data?.data || [];
        if (restaurants && restaurants.length > 0) {
          setRestaurantId(restaurants[0]._id || restaurants[0].id);
        }

        // Fetch tables
        const resTable = await axios.get("/table");
        const response = await axios.get("/product");
        setProducts(response?.data?.data?.data || response?.data?.data || []);
        const tables = resTable?.data?.data?.data || resTable?.data?.data || [];

        if (tables && tables.length > 0) {
          let selectedTable;
          if (urlTableId) {
            selectedTable = tables.find(t => (t._id || t.id) === urlTableId);
          }

          // Fallback logic if no URL param or not found
          if (!selectedTable) {
            selectedTable = tables.find(t => t.name === "Mesa 2" || t.numero === 2 || t.number === 2) || tables[0];
          }

          if (selectedTable) {
            setTableId(selectedTable._id || selectedTable.id);
            setTableName(selectedTable.name ? selectedTable.name.toUpperCase() : `MESA ${selectedTable.numero || selectedTable.number}`);
          }
        }
      } catch (err) {
        console.error("Error fetching context", err);
      }
    };
    fetchContext();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await axios.get("/product");
        // El backend devuelve { data: { data: [ ... ] } }
        setProducts(res.data.data.data);
      } catch (err) {
        setErrorProducts("Error al cargar productos");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Extraer categorías únicas de los productos
  const categories = [
    "TODAS",
    "MEJORES",
    ...Array.from(
      new Set(
        products.map((p) =>
          p.categorias && p.categorias.length > 0 && p.categorias[0]?.nombre
            ? p.categorias[0].nombre.toUpperCase()
            : (p.categoria || "").toUpperCase()
        )
      )
    ).filter(Boolean),
  ];

  const [selectedCategory, setSelectedCategory] = useState("TODAS");
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Filtrar productos por categoría
  const filteredProducts =
    selectedCategory === "TODAS"
      ? products
      : selectedCategory === "MEJORES"
        ? products.filter((p) => (p.costo || p.price) > 100)
        : products.filter((p) => {
          const cat =
            p.categorias && p.categorias.length > 0 && p.categorias[0]?.nombre
              ? p.categorias[0].nombre.toUpperCase()
              : (p.categoria || "").toUpperCase();
          return cat === selectedCategory;
        });

  // Agrupar productos por categoría para mostrar
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat =
      product.categorias &&
        product.categorias.length > 0 &&
        product.categorias[0]?.nombre
        ? product.categorias[0].nombre
        : product.categoria || "Sin categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  // Funciones del carrito
  const addToCart = (product) => {
    const id = product._id || product.id;
    const name = product.nombre || product.name;
    const price = product.costo || product.price;
    const existingItem = cart.find((item) => item.id === id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...product, id, name, price, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (productId, change) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId) {
            return { ...item, quantity: Math.max(0, item.quantity + change) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!restaurantId || !tableId) {
      alert("Error: No se pudo identificar el restaurante o la mesa. Asegúrese de que hay datos en la base de datos.");
      return;
    }

    try {
      const orderData = {
        restaurant: restaurantId,
        table: tableId,
        productos: cart.map(item => ({
          product: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      await axios.post("/order", orderData);
      alert("¡Pedido realizado con éxito!");
      setCart([]);
      setShowCart(false);
    } catch (err) {
      console.error("Error al crear el pedido", err);
      alert("Error al crear el pedido: " + (err.response?.data?.message || err.message));
    }
  };


  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };



  if (loadingProducts)
    return (
      <div className="restaurant-app">
        <p>Cargando productos...</p>
      </div>
    );
  if (errorProducts)
    return (
      <div className="restaurant-app">
        <p>{errorProducts}</p>
      </div>
    );

  return (
    <div className="restaurant-app">
      {/* Header */}
      <div className="header">
        <h1>{tableName}</h1>

        {/* Categories */}
        <div className="categories-container">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category - btn ${selectedCategory === category ? "active" : ""} `}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="content">
        {Object.entries(groupedProducts).map(([category, products]) => (
          <div key={category} className="category-section">
            <div className="category-header">
              <div className="category-indicator"></div>
              <h2 className="category-title">{category}</h2>
              <div className="category-line"></div>
            </div>

            <div className="products-grid">
              {products.map((product, idx) => {
                // Nombre y precio desde la API
                const name = product.nombre || product.name || "Sin nombre";
                const price = product.costo || product.price || 0;
                // Imagen dinámica: si el producto tiene imagen, úsala; si no, asigna una de la lista
                const image =
                  product.image || foodImages[idx % foodImages.length];
                return (
                  <div key={product._id || product.id} className="product-card">
                    <div className="product-image-container">
                      <img
                        src={image}
                        alt={name}
                        className="product-image"
                        loading="lazy"
                      />
                    </div>
                    <div className="product-details-new">
                      <h3 className="product-name-large">{name}</h3>
                      <div className="product-row">
                        <p className="product-price-large">${price}</p>
                        <button
                          onClick={() =>
                            addToCart({ ...product, name, price, image })
                          }
                          className="add-plus-btn"
                        >
                          <span className="add-text">ADD</span>
                          <span className="plus-icon">
                            <Plus size={24} />
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="bottom-bar">
        <div className="language-selector">
          <span className="language-text">ESP</span>
          <div className="language-arrow"></div>
        </div>

        <button onClick={() => setShowCart(true)} className="cart-btn">
          <ShoppingCart size={20} />
          <span>Ver carrito</span>
          {getTotalItems() > 0 && (
            <span className="cart-count">{getTotalItems()}</span>
          )}
        </button>
      </div>

      {/* Cart Overlay */}
      {showCart && (
        <div className="cart-overlay">
          <div className="cart-panel">
            <div className="cart-header">
              <div className="cart-header-content">
                <h2 className="cart-title">DESGLOSE</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="close-btn"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="cart-content">
              {cart.length === 0 ? (
                <p className="empty-cart">Tu carrito está vacío</p>
              ) : (
                <>
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-header">
                        <h3 className="cart-item-name">{item.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="remove-item-btn"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="cart-item-controls">
                        <div className="quantity-controls">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="quantity-btn"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="quantity-display">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="quantity-btn"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <span className="item-total">
                          ${item.price * item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="checkout-section">
                    <button className="checkout-btn" onClick={handleCheckout}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div className="checkout-icon"></div>
                        <span>Pagar</span>
                      </div>
                      <span>${getTotalPrice()}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDesign;

