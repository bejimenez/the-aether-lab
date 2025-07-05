import { User } from 'lucide-react';

const UserSwitcher = ({ users, currentUser, onUserChange }) => (
  <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
    <User className="w-4 h-4" />
    <label className="text-sm font-medium">Current User:</label>
    <select
      value={currentUser}
      onChange={(e) => onUserChange(parseInt(e.target.value))}
      className="px-3 py-1 border rounded-md text-sm bg-background text-foreground"
    >
      {users.map(user => (
        <option key={user.id} value={user.id}>
          {user.username}
        </option>
      ))}
    </select>
  </div>
);

export default UserSwitcher;