
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


const CatImage = () => (
  <div style={{ width: 300, height: 200 }}>
    <img
      src="https://cdn2.thecatapi.com/images/MTY3ODIyMQ.jpg"
      alt="Cat"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </div>
);

export default CatImage;
