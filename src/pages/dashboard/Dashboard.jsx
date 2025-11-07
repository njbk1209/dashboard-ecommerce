import React from "react";
import Layout from "../../hocs/Layout";
import { Outlet, NavLink, useNavigate } from "react-router";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

import {
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Chip,
  Accordion,
  AccordionHeader,
  AccordionBody,
  Alert,
  Input,
  Drawer,
  Card,
} from "@material-tailwind/react";
import {
  PresentationChartBarIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronRightIcon as CR,
  CubeTransparentIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { logout } from "../../redux/features/user/userSlices";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const SidebarContent = ({ handleOpen, open, closeDrawer, dispatch, navigate }) => (
  <Card color="transparent" shadow={false} className="h-[calc(100vh-2rem)] w-full p-4">
    <div className="mb-2 flex items-center gap-4 p-4">
      <img
        src="https://docs.material-tailwind.com/img/logo-ct-dark.png"
        alt="brand"
        className="h-8 w-8"
      />
      <Typography variant="h5" color="blue-gray">
        Sidebar
      </Typography>
    </div>
    <List>
      <Accordion
        open={open === 1}
        icon={
          <ChevronDownIcon
            strokeWidth={2.5}
            className={`mx-auto h-4 w-4 transition-transform ${open === 1 ? "rotate-180" : ""}`}
          />
        }
      >
        <ListItem className="p-0" selected={open === 1}>
          <AccordionHeader onClick={() => handleOpen(1)} className="border-b-0 p-3">
            <ListItemPrefix>
              <PresentationChartBarIcon className="h-5 w-5" />
            </ListItemPrefix>
            <Typography color="blue-gray" className="mr-auto font-normal">
              Dashboard
            </Typography>
          </AccordionHeader>
        </ListItem>
        <AccordionBody className="py-1">
          <List className="p-0">
            <NavLink to="/dashboard">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Inicio
              </ListItem>
            </NavLink>
            <NavLink to="shipping/cuts">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Cortes de envío
              </ListItem>
            </NavLink>
            <NavLink to="orders/order-cuts">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Cortes de ventas
              </ListItem>
            </NavLink>
          </List>
        </AccordionBody>
      </Accordion>

      <Accordion
        open={open === 2}
        icon={
          <ChevronDownIcon
            strokeWidth={2.5}
            className={`mx-auto h-4 w-4 transition-transform ${open === 2 ? "rotate-180" : ""}`}
          />
        }
      >
        <ListItem className="p-0" selected={open === 2}>
          <AccordionHeader onClick={() => handleOpen(2)} className="border-b-0 p-3">
            <ListItemPrefix>
              <ShoppingBagIcon className="h-5 w-5" />
            </ListItemPrefix>
            <Typography color="blue-gray" className="mr-auto font-normal">
              E-Commerce
            </Typography>
          </AccordionHeader>
        </ListItem>
        <AccordionBody className="py-1">
          <List className="p-0">
            <NavLink to="orders">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Pedidos
              </ListItem>
            </NavLink>
            <NavLink to="shipping">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Envíos
              </ListItem>
            </NavLink>
            <NavLink to="products">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Productos
              </ListItem>
            </NavLink>
            <NavLink to="promotion">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Promociones
              </ListItem>
            </NavLink>
            <NavLink to="users">
              <ListItem onClick={closeDrawer}>
                <ListItemPrefix>
                  <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                </ListItemPrefix>
                Usuarios
              </ListItem>
            </NavLink>
          </List>
        </AccordionBody>
      </Accordion>

      <hr className="my-2 border-blue-gray-50" />

      <ListItem>
        <ListItemPrefix>
          <UserCircleIcon className="h-5 w-5" />
        </ListItemPrefix>
        Profile
      </ListItem>
      <NavLink to="settings">
        <ListItem>
          <ListItemPrefix>
            <Cog6ToothIcon className="h-5 w-5" />
          </ListItemPrefix>
          Settings
        </ListItem>
      </NavLink>
      <ListItem
        onClick={() => {
          dispatch(logout());
          navigate("/");
          toast.success("Successful logout!");
        }}
      >
        <ListItemPrefix>
          <PowerIcon className="h-5 w-5" />
        </ListItemPrefix>
        Log Out
      </ListItem>
    </List>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [open, setOpen] = React.useState(0);
  const [openAlert, setOpenAlert] = React.useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <Layout>
      {/* Drawer para pantallas pequeñas (xs..md) */}
      <Drawer open={isDrawerOpen} onClose={closeDrawer} className="lg:hidden">
        <SidebarContent
          handleOpen={handleOpen}
          open={open}
          closeDrawer={closeDrawer}
          dispatch={dispatch}
          navigate={navigate}
        />
      </Drawer>

      {/* Sidebar fijo para lg+ */}
      <aside
        className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40"
        aria-hidden={false}
      >
        <SidebarContent
          handleOpen={handleOpen}
          open={open}
          closeDrawer={() => {}}
          dispatch={dispatch}
          navigate={navigate}
        />
      </aside>

      <main className="lg:pl-64">
        <header className="shadow p-2 lg:py-3 lg:px-4 flex items-center justify-between lg:hidden">
          {/* Botón hamburguesa sólo visible en pantallas < lg */}
          <div className="flex items-center">
            <IconButton
              variant="text"
              size="lg"
              onClick={openDrawer}
              className="lg:hidden"
            >
              {isDrawerOpen ? (
                <XMarkIcon className="h-8 w-8 stroke-2" />
              ) : (
                <Bars3Icon className="h-8 w-8 stroke-2" />
              )}
            </IconButton>
            <Typography className="ml-2 text-base lg:text-lg">Panel</Typography>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </Layout>
  );
};

export default Dashboard;
