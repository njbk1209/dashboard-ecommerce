import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from "@material-tailwind/react";
import { store } from './redux/store.js'
import { Provider } from 'react-redux'
import { BrowserRouter } from "react-router";
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
          <Toaster
            toastOptions={{
              success: {
                duration: 4000,
              },
            }}
          />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
