import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const PropertyDetails = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    const mockApiResponse = [
      {
        id: 1,
        address: "123 Main St",
        price: 250000,
        description: "A beautiful home with modern amenities.",
      },
      {
        id: 2,
        address: "456 Oak Rd",
        price: 300000,
        description: "A spacious house with a stunning view.",
      },
    ];

    const selectedProperty = mockApiResponse.find((p) => p.id === parseInt(id));
    setProperty(selectedProperty);
  }, [id]);

  if (!property) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6 mt-10 border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-900 mb-3">{property.address}</h2>
      <p className="text-blue-600 text-2xl font-semibold">${property.price.toLocaleString()}</p>
      <p className="text-gray-700 mt-4">{property.description}</p>
    </div>
  );
};

export default PropertyDetails;
