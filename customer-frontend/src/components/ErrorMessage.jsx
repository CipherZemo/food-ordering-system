import { AlertCircle } from 'lucide-react';

const ErrorMessage = ({ message }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
      <AlertCircle className="text-red-600" size={24} />
      <p className="text-red-800">{message}</p>
    </div>
  );
};

export default ErrorMessage;