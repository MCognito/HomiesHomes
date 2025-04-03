# HomiesHomes Real Estate API

A comprehensive real estate platform built with modern web technologies. This project provides a RESTful API backend and a responsive React frontend for property listings, user management, bookings, favorites, and agent functionality.

## Features

- **Property Listings**: Browse, search, and filter properties by various criteria
- **User Authentication**: Secure JWT-based login and registration system
- **Role-Based Access**: Different capabilities for regular users, agents, and administrators
- **Booking System**: Schedule property viewings with real estate agents
- **Favorites**: Save properties to a favorites list for later viewing
- **Agent Application**: Apply to become a property agent with admin approval workflow
- **HATEOAS Support**: API follows Hypermedia as the Engine of Application State principles
- **Interactive Documentation**: Full OpenAPI documentation

## Technology Stack

### Backend

- **Node.js**: JavaScript runtime
- **Koa.js**: Lightweight, modern web framework
- **MySQL**: Relational database for data storage
- **JWT**: JSON Web Tokens for secure authentication
- **OpenAPI**: API documentation

### Frontend

- **React.js**: Component-based UI library
- **React Router**: Client-side routing
- **CSS3**: Modern styling with flexbox and grid layouts
- **FontAwesome**: Icon library for enhanced UI

## API Documentation

API documentation is available at:

- https://gammacairo-deltareward-3000.codio-box.uk:9030

The documentation is generated using OpenAPI 3.0 and includes:

- All available endpoints
- Request and response formats
- Authentication requirements
- Sample requests and responses

## Server URLs

- **API Server**: https://gammacairo-deltareward-9001.codio-box.uk
- **Frontend**: https://gammacairo-deltareward-3000.codio-box.uk

## Local Development

### Backend Setup

1. Clone the repository
2. Navigate to `/backend`
3. Run `npm install`
4. Configure MySQL connection in `.env`
5. Run `npm start` to start the API server

### Frontend Setup

1. Navigate to `/my-frontend`
2. Run `npm install`
3. Run `npm start` to start the development server

## Running API Documentation in Codio

The API documentation is served using a separate server for better organisation:

1. From the Codio menu at the top, click the **Run** button and select **Start API Docs**
2. Once the server is running, click the **Preview** button and select **API Documentation**
3. The OpenAPI documentation will load in a new tab or window
4. Documentation is served on port 9030 and includes detailed information about all API endpoints
