// Ejemplo con React (useEffect + paginación/búsqueda)
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminUsers } from '../../../redux/features/user/userSlices';

function AdminUsersTable() {
  const dispatch = useDispatch();
  const { items, count, status, params } = useSelector((s) => s.user.adminUsers);

  useEffect(() => {
    // carga inicial
    dispatch(fetchAdminUsers({ page: 1, page_size: 20 }));
  }, [dispatch]);

  const onSearch = (text) => {
    dispatch(fetchAdminUsers({ ...params, page: 1, search: text }));
  };

  const onChangePage = (page) => {
    dispatch(fetchAdminUsers({ ...params, page }));
  };

  const onOrdering = (ordering) => {
    dispatch(fetchAdminUsers({ ...params, ordering }));
  };

  if (status === 'loading') return <p>Cargando...</p>;
  if (status === 'failed') return <p>Error cargando usuarios</p>;

  return (
    <div>
      <h2>Usuarios ({count})</h2>

      {/* Controles */}
      <input
        placeholder="Buscar por email o nombre"
        defaultValue={params.search}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(e.target.value)}
      />
      <button onClick={() => onOrdering('email')}>Ordenar por email</button>
      <button onClick={() => onOrdering('-last_name')}>Apellido desc</button>

      {/* Tabla simple */}
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Email</th><th>Nombre</th><th>Perfil (ciudad)</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.full_name}</td>
              <td>{u.profile?.city ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <div style={{ marginTop: 8 }}>
        <button
          disabled={!params.page || params.page <= 1}
          onClick={() => onChangePage(params.page - 1)}
        >
          Anterior
        </button>
        <span style={{ margin: '0 8px' }}>Página {params.page}</span>
        <button onClick={() => onChangePage(params.page + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

export default AdminUsersTable;