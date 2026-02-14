
import { useParams } from 'react-router-dom';

export default function AppointmentReschedule() {
  const { token } = useParams();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reporter votre rendez-vous</h1>
      <p>Vous êtes sur le point de reporter le rendez-vous (Token: {token}).</p>
      {/* TODO: Add rescheduling logic here */}
    </div>
  );
}
