'use client'
import { supabase } from "../lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";
import { Product } from "../types/productsdata";
import { useEffect, useState } from "react";
export default function Home() {
  const[products, setProducts] = useState<Product[]>([]);
  const[isLoading, setIsLoading] = useState<boolean>(true);
  const[uploading, setUploading] = useState<boolean>(false);

  const[isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const[nombre, setNombre] = useState<string>("");
  const[file, setFile] = useState<File | null>(null);
  const[precio, setPrecio] = useState<number>(0);

  const [isUpdateOpen, setIsUpdateOpen] = useState<boolean>(false);
  const[currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const[updatedNombre, setUpdatedNombre] = useState<string>("");
  const[updatedPrecio, setUpdatedPrecio] = useState<number>(0);
  const[updatedFile, setUpdatedFile] = useState<File | null>(null);

  //Read Leer productos
  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
    .from("productos")
    .select("*")
    .order("id", { ascending: false });
    if (error) {
      console.error("Error fetching products:", error);
    } else {
      setProducts(data as Product[]);
    }
    setIsLoading(false);
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  //Create Crear productos
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if(nombre.trim() === "" || precio <= 0)  return;
    setUploading(true);
    let imageUrl = ""; 
    try {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName= `${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
          .from("productos-imagenes")
          .upload(fileName, file);
          if (uploadError) {
            throw uploadError;
          }
          const{ data:publicData } = supabase.storage
          .from("productos-imagenes")
          .getPublicUrl(fileName);
          imageUrl = publicData.publicUrl;
        }
        const { error } = await supabase
          .from("productos")
          .insert([{ nombre:nombre, 
            image: imageUrl, 
            precio:precio
          }
        ]);
        if (error) {
          console.error("Error creando producto:", error);
        }
        setNombre("");
        setFile(null);
        setPrecio(0);
        fetchProducts();  
    }
    catch (error) {
      console.error("Error subiendo imagen:", error);
    }
    finally {
      setUploading(false);
    }
  };
 // Update Actualizar productos
 const openUpdateModal = (product: Product) => {
    setCurrentProduct(product);
    setUpdatedNombre(product.nombre);
    setUpdatedPrecio(product.precio);
    setUpdatedFile(null);
    setIsUpdateOpen(true);
  };
  const updateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;
    setUploading(true);
    let imageUrl = currentProduct.image; 
    try {
        if (updatedFile) {
          const fileExt = updatedFile.name.split('.').pop();
          const fileName= `${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
          .from("productos-imagenes")
          .upload(fileName, updatedFile);
          if (uploadError) {
            throw uploadError;
          }
          const{ data:publicData } = supabase.storage
          .from("productos-imagenes")
          .getPublicUrl(fileName);
          imageUrl = publicData.publicUrl;
        }
        const { error } = await supabase
          .from("productos")
          .update({ nombre: updatedNombre, image: imageUrl, precio: updatedPrecio })
          .eq("id", currentProduct.id);
        if (error) {
          console.error("Error actualizando producto:", error);
        }
        setIsUpdateOpen(false);
        setCurrentProduct(null);
        fetchProducts();  
    }
    catch (error) {
      console.error("Error subiendo imagen:", error);
    }
    finally {
      setUploading(false);
    }
  };
  //Delete Eliminar productos
  const deleteProduct = async (id: number) => {
    const { error } = await supabase
    .from("productos")
    .delete()
    .eq("id", id)
    if (error) {
      console.error("Error eliminando producto:", error);
    } else {
      fetchProducts();
    }
  };
    
  return (
    <main className="w-full min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 flex flex-col items-center">
      {/* Encabezado y Botón para abrir Modal de Creación */}
      <div className="w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-wide">Gestão de Produtos</h1>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl shadow-lg transition duration-200 flex items-center gap-2"
        >
          + Novo Produto
        </button>
      </div>

      {/* Listado de Productos Adaptable */}
      <div className="w-full max-w-4xl">
        {isLoading ? (
          <p className="text-center text-gray-400 py-10">Carregando produtos...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-lg">Não há produtos cadastrados</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-md flex flex-col justify-between">
                <div>
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.nombre} 
                      className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-700" 
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-700 rounded-xl mb-4 flex items-center justify-center text-xs text-gray-400">
                      Sem foto
                    </div>
                  )}
                  <h2 className="font-bold text-lg text-white truncate">{product.nombre}</h2>
                  <p className="text-blue-400 font-semibold text-lg mb-4">${product.precio.toFixed(2)}</p>
                </div>
                
                <div className="flex gap-2 pt-2 border-t border-gray-700">
                  <button 
                    onClick={() => openUpdateModal(product)}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 px-3 rounded-lg font-medium text-sm transition"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => deleteProduct(product.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-lg font-medium text-sm transition"
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CREAR PRODUCTO */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-gray-100 relative">
            <h2 className="text-xl font-bold mb-4">Criar Novo Produto</h2>
            <form onSubmit={createProduct} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Nome do produto"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Imagen do produto:</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  required
                />
              </div>
              <input 
                type="number" 
                step="0.01"
                placeholder="Precio"
                value={precio || ""}
                onChange={(e) => setPrecio(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  Excluir
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:bg-gray-500"
                >
                  {uploading ? "Carregando..." : "Salvar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACTUALIZAR PRODUCTO */}
      {isUpdateOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-gray-100 relative">
            <h2 className="text-xl font-bold mb-4">Editar Produto</h2>
            <form onSubmit={updateProduct} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Nome do produto"
                value={updatedNombre}
                onChange={(e) => setUpdatedNombre(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Editar imagen (opcional):</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUpdatedFile(e.target.files[0]);
                    }
                  }}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-gray-300 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
              </div>
              <input 
                type="number" 
                step="0.01"
                placeholder="Precio"
                value={updatedPrecio || ""}
                onChange={(e) => setUpdatedPrecio(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUpdateOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  Excluir
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:bg-gray-500"
                >
                  {uploading ? "Carregando..." : "Salvar produto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
