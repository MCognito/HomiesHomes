import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const PropertyList = () => {
  const [properties, setProperties] = useState([]);

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
    setProperties(mockApiResponse);
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Properties for Sale</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((property) => (
          <div key={property.id} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition duration-300">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900">{property.address}</h3>
              <p className="text-blue-600 text-lg font-bold">${property.price.toLocaleString()}</p>
              <p className="text-gray-600">{property.description}</p>
              <Link to={`/property/${property.id}`} className="mt-3 inline-block text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md transition duration-300">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
