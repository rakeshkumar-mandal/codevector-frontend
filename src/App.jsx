import { useState, useEffect, useCallback, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "";

const CATEGORY_COLORS = {
  Electronics: "#6c63ff",
  Clothing: "#ff6b9d",
  Books: "#43c59e",
  "Home & Kitchen": "#f9a825",
  Sports: "#ef5350",
  Toys: "#ab47bc",
  Beauty: "#ec407a",
  Automotive: "#42a5f5",
  Groceries: "#66bb6a",
  Furniture: "#ff7043",
};

function CategoryBadge({ category }) {
  const color = CATEGORY_COLORS[category] || "#7b7f9e";
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.4,
      background: color + "22",
      color,
      border: `1px solid ${color}44`,
    }}>
      {category}
    </span>
  );
}

function ProductCard({ product }) {
  const date = new Date(product.created_at).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "14px 16px",
      display: "grid",
      gridTemplateColumns: "48px 1fr auto",
      gridTemplateRows: "auto auto",
      gap: "4px 12px",
      alignItems: "center",
    }}>
      {/* ID chip */}
      <div style={{
        gridRow: "1 / 3",
        width: 48, height: 48,
        borderRadius: 8,
        background: "var(--surface2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, color: "var(--text-muted)", fontWeight: 600,
        flexShrink: 0,
      }}>
        #{product.id}
      </div>

      {/* Name */}
      <div style={{
        fontWeight: 600, fontSize: 14,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {product.name}
      </div>

      {/* Price */}
      <div style={{
        fontWeight: 700, fontSize: 15,
        color: "var(--green)", whiteSpace: "nowrap",
        textAlign: "right",
      }}>
        ₹{Number(product.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </div>

      {/* Category + date row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <CategoryBadge category={product.category} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{date}</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "14px 16px",
      height: 72,
      animation: "pulse 1.4s ease-in-out infinite",
    }} />
  );
}

export default function App() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [products, setProducts] = useState([]);
  const [cursorStack, setCursorStack] = useState([]);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [limit] = useState(20);
  const fetchId = useRef(0);

  useEffect(() => {
    fetch(`${API}/api/products/categories`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (cursor, stack, catOverride) => {
    const category = catOverride !== undefined ? catOverride : selectedCategory;
    const id = ++fetchId.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit });
      if (category) params.set("category", category);
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`${API}/api/products?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (id !== fetchId.current) return;
      setProducts(json.data);
      setNextCursor(json.pagination.next_cursor);
      setCurrentCursor(cursor);
      setCursorStack(stack);
      setPageNum(stack.length + 1);
    } catch (err) {
      if (id === fetchId.current) setError(err.message);
    } finally {
      if (id === fetchId.current) setLoading(false);
    }
  }, [selectedCategory, limit]);

  useEffect(() => {
    fetchProducts(null, [], selectedCategory);
  }, [selectedCategory]);

  function scrollTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function handleNext() {
    if (!nextCursor) return;
    const newStack = currentCursor ? [...cursorStack, currentCursor] : cursorStack;
    fetchProducts(nextCursor, newStack, undefined);
    scrollTop();
  }

  function handlePrev() {
    if (cursorStack.length === 0) return;
    const prevCursor = cursorStack[cursorStack.length - 1];
    fetchProducts(prevCursor || null, cursorStack.slice(0, -1), undefined);
    scrollTop();
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 12px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, marginBottom: 4 }}>
          Product Browser
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          200,000 products · cursor pagination · consistent during live updates
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            background: "var(--surface)",
            color: selectedCategory ? "var(--text)" : "var(--text-muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "9px 14px",
            fontSize: 14,
            cursor: "pointer",
            outline: "none",
            flex: 1,
            minWidth: 140,
          }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div style={{
          fontSize: 13, color: "var(--text-muted)",
          display: "flex", alignItems: "center", gap: 6,
          whiteSpace: "nowrap",
        }}>
          <span style={{
            display: "inline-block", width: 7, height: 7, borderRadius: "50%",
            background: loading ? "#f9a825" : "var(--green)",
          }} />
          {loading ? "Loading..." : `Page ${pageNum}`}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#ff6b6b22", border: "1px solid #ff6b6b44",
          borderRadius: 8, padding: "12px 16px", color: "var(--red)",
          marginBottom: 16, fontSize: 14,
        }}>
          Error: {error}
        </div>
      )}

      {/* Product list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading
          ? Array.from({ length: limit }).map((_, i) => <Skeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)
        }
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 20, gap: 10,
        }}>
          <button onClick={handlePrev} disabled={cursorStack.length === 0} style={btnStyle(cursorStack.length === 0)}>
            ← Prev
          </button>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Page {pageNum} · {products.length} items
          </span>
          <button onClick={handleNext} disabled={!nextCursor} style={btnStyle(!nextCursor)}>
            Next →
          </button>
        </div>
      )}

      {!loading && products.length === 0 && !error && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
          No products found{selectedCategory ? ` in "${selectedCategory}"` : ""}.
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        select option { background: #1a1d2e; }
      `}</style>
    </div>
  );
}

function btnStyle(disabled) {
  return {
    background: disabled ? "var(--surface)" : "var(--accent)",
    color: disabled ? "var(--text-muted)" : "#fff",
    border: `1px solid ${disabled ? "var(--border)" : "var(--accent)"}`,
    borderRadius: 8, padding: "9px 18px",
    fontSize: 14, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}