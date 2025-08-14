import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./AdminDashboard.module.scss";

import OperatorManager from "../../components/OperatorManager/OperatorManager";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    role: "operator",
  });
  const [editingUser, setEditingUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState(
    "https://shift-scheduler-server.vercel.app"
  );
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async (url) => {
      try {
        const response = await axios.get(`${url}/auth/users`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          timeout: 5000,
        });
        setUsers(response.data);
        setError(null);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError("Failed to fetch users. Please try again.");
        if (error.response && error.response.status === 401) {
          navigate("/login");
        }
      }
    };

    const checkLocalhost = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const response = await fetch("http://localhost:4040", {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          setBaseUrl("http://localhost:4040");
          fetchUsers("http://localhost:4040");
        } else {
          fetchUsers(baseUrl);
        }
      } catch {
        fetchUsers(baseUrl);
      }
    };

    checkLocalhost();
  }, [baseUrl, navigate]);

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    try {
      await axios.post(`${baseUrl}/auth/register`, newUser, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        timeout: 5000,
      });
      setNewUser({
        username: "",
        password: "",
        confirmPassword: "",
        role: "operator",
      });
      setIsAdding(false);
      window.location.reload();
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Failed to add user.");
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({ ...user });
    setEditPassword("");
    setEditConfirmPassword("");
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (editPassword && editPassword !== editConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    const updateData = {
      username: editingUser.username,
      role: editingUser.role,
    };
    if (editPassword) updateData.password = editPassword;

    try {
      await axios.put(`${baseUrl}/auth/update/${editingUser._id}`, updateData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        timeout: 5000,
      });
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error("Error editing user:", error);
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${baseUrl}/auth/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        timeout: 5000,
      });
      window.location.reload();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  const renderModal = (title, content, onClose, onSave) => (
    <div className={styles.modalOverlay}>
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
        </div>
        <div className={styles.modalBody}>{content}</div>
        <div className={styles.modalActions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={onSave}
          >
            Save
          </button>
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <div className={styles.pills}>
          <span className={styles.pill}>
            Users <strong>{users.length}</strong>
          </span>
          <span className={styles.pill}>
            API{" "}
            <strong>
              {baseUrl.includes("localhost") ? "Local" : "Vercel"}
            </strong>
          </span>
        </div>
      </div>

      {error && <div className={styles.alertError}>{error}</div>}

      {/* Operator manager block */}
      <div className={styles.card}>
        <div className={`${styles.cardHeader} ${styles.inner}`}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => setIsAdding(true)}
          >
            + Add User to Login System
          </button>
        </div>
        <div className={`${styles.cardBody} ${styles.inner}`}>
          <OperatorManager baseUrl={baseUrl} />
        </div>
      </div>

      {/* Users by role */}
      <div className={styles.grid}>
        {["admin", "leader", "operator"].map((role) => (
          <div key={role} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.roleTitle}>
                {role.charAt(0).toUpperCase() + role.slice(1)}s
              </h3>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((user) => user.role === role)
                    .map((user) => (
                      <tr key={user._id}>
                        <td className={styles.mono}>{user._id}</td>
                        <td>{user.username}</td>
                        <td>
                          <span className={styles.roleBadge}>{user.role}</span>
                        </td>
                        <td className={styles.actionsCell}>
                          <button
                            className={`${styles.btn} ${styles.btnSmall}`}
                            onClick={() => handleEditUser(user)}
                          >
                            Edit
                          </button>
                          <button
                            className={`${styles.btn} ${styles.btnSmall} ${styles.btnDanger}`}
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {isAdding &&
        renderModal(
          "Add New User",
          <>
            <input
              className={styles.input}
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) =>
                setNewUser({ ...newUser, username: e.target.value })
              }
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Confirm Password"
              value={newUser.confirmPassword}
              onChange={(e) =>
                setNewUser({ ...newUser, confirmPassword: e.target.value })
              }
            />
            <select
              className={styles.input}
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="admin">Admin</option>
              <option value="leader">Leader</option>
              <option value="operator">Operator</option>
            </select>
          </>,
          () => setIsAdding(false),
          handleAddUser
        )}

      {isEditing &&
        renderModal(
          "Edit User",
          <>
            <input
              className={styles.input}
              type="text"
              value={editingUser.username}
              onChange={(e) =>
                setEditingUser({ ...editingUser, username: e.target.value })
              }
            />
            <input
              className={styles.input}
              type="password"
              placeholder="New Password (optional)"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
            />
            <input
              className={styles.input}
              type="password"
              placeholder="Confirm New Password"
              value={editConfirmPassword}
              onChange={(e) => setEditConfirmPassword(e.target.value)}
            />
            <select
              className={styles.input}
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
            >
              <option value="admin">Admin</option>
              <option value="leader">Leader</option>
              <option value="operator">Operator</option>
            </select>
          </>,
          () => setIsEditing(false),
          handleSaveEdit
        )}
    </div>
  );
};

export default AdminDashboard;
