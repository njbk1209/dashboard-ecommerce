import { useState, useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../../redux/features/user/userSlices";
import { LoaderIcon } from "react-hot-toast";

export default function Login() {
    // Estado que controla mostrar y ocultar la clave a través de un checkbox.
    const [showHidePassword, setShowHidePassword] = useState(false);

    // Código de redux para acceder al estado y los thunks
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state) => state.user);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Validation yup.
    const validationSchema = Yup.object({
        email: Yup.string().email("Ingresa un email válido").required("Requerido"),
        password: Yup.string().required("Requerido"),
    });

    // Manejador del evento submit del formulario.
    const handleFormSubmit = async (values, { setSubmitting, resetForm }) => {
        try {
            setSubmitting(true);
            const resultAction = await dispatch(login(values)).unwrap();
            if (resultAction.access) {
                localStorage.setItem("access", resultAction.access);
                localStorage.setItem("refresh", resultAction.refresh);
                navigate("/dashboard");
            }
        } catch (error) {
            console.error("Error to Login");
        } finally {
            setSubmitting(false);
            resetForm()
        }
    };

    /* Si el usuario ya esta autenticado lo redirecciona al Inicio
    if (user?.isAuthenticated) {
        return <Navigate to="/" />;
    }*/

    return (

        <div className="flex items-center relative py-16">
            <div className="mx-auto bg-white flex flex-col justify-center py-12 px-16 border border-[#E0E0E0]">
                <div className="w-full min-w-[350px]">
                    <div className="flex flex-col justify-center items-center text-center mb-7">
                        <img
                            className="mx-auto h-12 w-auto"
                            src="https://klbtheme.com/grogin/wp-content/uploads/2023/11/grogin-logo-dark.png"
                            alt="Workflow"
                        />
                        <h1 className="text-[34px] font-bold leading-[74px] text-gray-900">Iniciar sesión</h1>
                    </div>
                    <Formik
                        initialValues={{ email: "", password: "" }}
                        validationSchema={validationSchema}
                        onSubmit={handleFormSubmit}
                    >
                        {({ isSubmitting }) => (
                            <Form className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm text-gray-900">Email*</label>
                                    <Field
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="example@quomodosoft.com"
                                        className="mt-1 pl-2 py-2 block w-full sm:text-sm border border-gray-300 rounded-md"
                                    />
                                    <ErrorMessage name="email" component="div" className="text-red-600 text-sm" />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm text-gray-900">Contraseña*</label>
                                    <Field
                                        id="password"
                                        name="password"
                                        type={showHidePassword ? "text" : "password"}
                                        placeholder="********"
                                        className="mt-1 pl-2 py-2 block w-full sm:text-sm border border-gray-300 rounded-md"
                                    />
                                    <ErrorMessage name="password" component="div" className="text-red-600 text-sm" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center text-sm">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-gray-700 focus:ring-gray-700 mr-2"
                                            onChange={() => setShowHidePassword(!showHidePassword)}
                                        />
                                        Ver contraseña
                                    </label>
                                </div>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
                                    >
                                        {isSubmitting ? (<LoaderIcon style={{
                                            width: '30px',
                                            height: '30px'
                                        }} />) : "Acceder"}
                                    </button>
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>

    );
}