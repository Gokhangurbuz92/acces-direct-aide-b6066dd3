import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function ProGuard({ children }) {
    const location = useLocation();
    const token = typeof window !== 'undefined' ? localStorage.getItem('pro_token') : null;

    if (!token) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?mode=pro&next=${next}`} replace />;
    }

    return children;
}

ProGuard.propTypes = {
    children: PropTypes.node
};
