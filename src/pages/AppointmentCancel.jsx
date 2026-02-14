
import { useParams } from 'react-router-dom';

export default function AppointmentCancel() {
  const { token } = useParams();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Annuler votre rendez-vous</h1>
      <p>Vous êtes sur le point d'annuler le rendez-vous (Token: {token}).</p>
      {/* TODO: Add cancellation logic here */}
    </div>
  );
}
