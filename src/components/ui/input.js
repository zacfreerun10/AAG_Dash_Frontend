export function Input(props) {
  return <input {...props} className="border border-gray-300 rounded px-2 py-1" />;
}

export function Button({ children, onClick }) {
  return (
    <button onClick={onClick} className="bg-blue-500 text-white px-4 py-2 rounded">
      {children}
    </button>
  );
}