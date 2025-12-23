import { useEffect, useState } from "react";
import ProductsTable from "./cmp/products-table";
import NavButton from "@/components/ui/navButton";
import { Coffee } from "lucide-react";
import { IProduct } from "./types";

function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch("http://localhost:3001/api/products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
      });
  };

  return (
    <main>
      <div className="flex flex-row items-start m-4 gap-4 justify-between">
        <p className="text-[var(--primary-text)]">Products Page</p>
        <NavButton
          to="/products/add"
          label="Agregar Producto"
          className="max-w-xs"
          icon={<Coffee />}
        />
      </div>

      <ProductsTable productsList={products} />
    </main>
  );
}

export default ProductsPage;
