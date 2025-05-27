import { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthenticated, load_user, refresh } from '../redux/features/user/userSlices';
import { Navigate } from "react-router";

export default function Layout({ children }) {
    const dispatch = useDispatch();
    const { isAuthenticated, userStatus, access } = useSelector((state) => state.user);

    useEffect(() => {
        const init = async () => {
            await dispatch(refresh());
            await dispatch(checkAuthenticated());
            await dispatch(load_user());
        };
        init();
    }, [dispatch]);

    if (userStatus === 'idle' || userStatus === 'loading') {
        return <div>Cargando...</div>;
    }
    
    if (!isAuthenticated && !access) {
        return <Navigate to="/" />;
    }
    
    return <div>{children}</div>;
}