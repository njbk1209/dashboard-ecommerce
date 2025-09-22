import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminProducts,
  clearProducts,
  exportProductsCSV,
  importProductsCSV,
} from "../../../redux/features/product/productsSlices";
import { Spinner } from "@material-tailwind/react";

const PRODUCTS_FILTERS = [
  { value: "", label: "Todos los productos" },
  { value: "in_stock", label: "En stock" },
  { value: "out_of_stock", label: "Sin stock" },
];

const ProductsDashboard = () => {
  const dispatch = useDispatch();
  const {
    products,
    productStatus,
    exportStatus,
    importStatus,
    importResult,
    error,
  } = useSelector((state) => state.product);

  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);

  const buildFilterParams = (filters) => {
    const params = {};

    // Stock
    if (filters.status === "in_stock") params.in_stock = "true";
    else if (filters.status === "out_of_stock") params.in_stock = "false"; // ✅ nuevo

    // Promoción
    if (filters.status === "for_sale") params.in_promo = "true";
    else if (filters.status === "out_for_sale") params.in_promo = "false";

    // Búsqueda
    if (filters.search) params.q = filters.search;

    return params;
  };

  useEffect(() => {
    dispatch(clearProducts());
    dispatch(fetchAdminProducts(buildFilterParams(filters)));
  }, [filters]);

  const handleFilterChange = (field, value) => {
    const updated = { ...filters, [field]: value };
    setFilters(updated);
    dispatch(fetchAdminProducts(buildFilterParams(updated)));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleImport = () => {
    if (selectedFile) {
      dispatch(importProductsCSV(selectedFile));
    }
  };

  return (
    <div className="text-gray-900 space-y-4">
      <h1 className="text-2xl mb-2">Gestión de productos</h1>

      {/* Filtros rápidos */}
      <div className="flex flex-row flex-wrap gap-2 sm:gap-x-2 text-sm">
        {PRODUCTS_FILTERS.map((status) => (
          <React.Fragment key={status.value}>
            {status.value !== "" && <span>|</span>}
            <button
              onClick={() => handleFilterChange("status", status.value)}
              className={`${
                filters.status === status.value
                  ? "text-gray-900 font-semibold"
                  : "text-blue-600"
              }`}
            >
              {status.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-end">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex flex-col">
            <label
              htmlFor="search-product"
              className="mb-1 text-sm text-gray-900"
            >
              Búsqueda de producto
            </label>
            <input
              type="text"
              id="search-product"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Nombre, Cod. Barra..."
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-semibold text-gray-800">
            Importar productos (.csv):
          </label>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block text-sm"
          />

          <button
            onClick={handleImport}
            disabled={!selectedFile || importStatus === "loading"}
            className="inline-flex space-x-2 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
              />
            </svg>

            <span>
              {importStatus === "loading" ? "Importando..." : "Subir archivo"}
            </span>
          </button>

          <button
            onClick={() => dispatch(exportProductsCSV())}
            disabled={exportStatus === "loading"}
            className="inline-flex space-x-2 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span>
              {exportStatus === "loading"
                ? "Exportando..."
                : "Descargar CSV de productos"}
            </span>
          </button>

          {importStatus === "succeeded" && (
            <p className="text-green-700 text-sm">
              ✅ {importResult?.message || "Importación exitosa"}
            </p>
          )}

          {importStatus === "failed" && (
            <p className="text-red-600 text-sm">❌ {error}</p>
          )}
        </div>
      </div>

      {/* Estado de carga */}
      {productStatus === "loading" && (
        <div className="text-sm text-gray-600 mt-6 flex items-center">
          <Spinner className="h-5 w-5 mr-4" color="blue" /> Cargando
          productos...
        </div>
      )}

      {/* Error */}
      {productStatus === "failed" && (
        <div className="text-sm text-red-600 mt-6">Error: {error}</div>
      )}

      {/* Tabla de productos */}
      {productStatus === "succeeded" && (
        <>
          {products?.results.length === 0 ? (
            <div className="text-sm text-gray-600 mt-6">
              No hay productos disponibles para mostrar.
            </div>
          ) : (
            <div className="overflow-x-auto mt-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Cod. Barra
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Stock
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Precio
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Comparación
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Habilitado
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products?.results.map((product) => (
                    <tr key={product.id} className="text-xs">
                      <td className="px-4 py-2 text-gray-800">
                        <Link
                          to={`http://localhost:8000/admin/product/product/${product.id}/change/`}
                          className="text-blue-600 underline"
                        >
                          {product.code_bar}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-gray-800 text-xs font-medium">
                        {product.product_name}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {product.stock > 0 ? (
                          <span className="text-green-800">Disponible</span>
                        ) : (
                          <span className="text-red-800">Agotado</span>
                        )}{" "}
                        {"("}
                        {product.stock}
                        {")"}
                      </td>
                      <td className="px-4 py-2">
                        ${product.regular_price}{" "}
                        <span className="text-gray-500">
                          {product.iva_status === "incluye IVA"
                            ? "Incluye IVA"
                            : "Exento de IVA"}
                        </span>
                      </td>
                      <td className="px-4 py-2">${product.compare_price}</td>
                      <td className="px-4 py-2 text-xs">
                        {product.for_sales ? (
                          <span className="text-green-700 bg-green-100 rounded-full font-medium py-1 px-2">
                            Si
                          </span>
                        ) : (
                          <span className="text-red-700 bg-red-100 rounded-full font-medium py-1 px-2">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 flex space-x-3 text-xs">
                        <Link
                          to={`http://localhost:8000/admin/product/product/${product.id}/change/`}
                          className="text-blue-600 underline"
                        >
                          Editar
                        </Link>
                        <button className="text-red-700 underline">
                          Desactivar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsDashboard;
