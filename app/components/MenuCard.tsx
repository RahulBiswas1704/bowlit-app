"use client";
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { useCart } from "../context/CartContext"; 
import { useState } from "react";

interface MenuCardProps {
  title: string;
  description: string;
  price: string; 
  image: string;
  type: "Veg" | "Non-Veg";
}

export default function MenuCard({ title, description, price, image, type }: MenuCardProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    // Convert "₹160" -> 160
    const priceNumber = parseInt(price.replace(/[^0-9]/g, ''));
    
    addToCart({
      id: "", // Context will replace this with a real unique string ID
      name: title,
      price: priceNumber,
      image: image,
      plan: "Standard Plan",
      type: type,
      quantity: 1 // <--- Added this required property!
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1000);
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col h-full"
    >
      <div className="relative h-48 overflow-hidden shrink-0">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${type === "Veg" ? "bg-green-500" : "bg-red-500"}`} />
          {type}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{title}</h3>
          <span className="font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-sm">{price}</span>
        </div>
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{description}</p>
        
        <button 
          onClick={handleAdd}
          className={`w-full py-3 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
            isAdded 
            ? "bg-green-600 border-green-600 text-white" 
            : "border-orange-100 text-orange-600 hover:bg-orange-600 hover:text-white hover:border-orange-600"
          }`}
        >
          {isAdded ? <><Check size={18}/> Added!</> : <><Plus size={18}/> Add to Cart</>}
        </button>
      </div>
    </motion.div>
  );
}