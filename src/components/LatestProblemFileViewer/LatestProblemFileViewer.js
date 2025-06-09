import React, { useState } from "react";
import axios from "axios";
import "./LatestProblemFileViewer.scss";

const LatestProblemFileViewer = () => {
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [problems, setProblems] = useState([]);

  const fetchLatestFile = async () => {
    try {
      const res = await axios.get("http://localhost:4040/api/problem-file");
      setFileData(res.data);
      setError("");
    } catch (err) {
      setError("⚠️ Не вдалося отримати файл");
      setFileData(null);
    }
  };

  const openFolder = async (folderPath) => {
    try {
      await axios.get(
        `http://localhost:4040/api/problem-file/open?path=${encodeURIComponent(
          folderPath
        )}`
      );
    } catch (err) {
      alert("❌ Не вдалося відкрити папку");
    }
  };

  const parseContent = (content) => {
    const lines = content.split("\n");
    const parsed = {};
    lines.forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        parsed[key.trim()] = value.replace(/"/g, "").trim();
      }
    });
    return parsed;
  };

  const handleAddToList = () => {
    if (!fileData) return;
    const parsed = parseContent(fileData.content);

    setProblems((prev) => [
      ...prev,
      {
        filename: fileData.filename,
        ...parsed,
        comment,
        addedBy: "Andrii",
        createdAt: new Date().toLocaleString(),
      },
    ]);

    setComment("");
    setFileData(null);
  };

  const parsed = fileData ? parseContent(fileData.content) : {};

  return (
    <div className="latest-problem-file">
      <button onClick={fetchLatestFile} className="btn-fetch-problem-file">
        Додай проблемний файл
      </button>

      {error && <p className="error">{error}</p>}

      {fileData && (
        <div className="file-output">
          <h4>📝 {fileData.filename}</h4>
          <pre>{fileData.content}</pre>
          <hr />
          <p>
            <strong>Модель:</strong> {parsed.model}
          </p>
          <p>
            <strong>Колір:</strong> {parsed.color}
          </p>
          <p>
            <strong>Шлях до файлу:</strong> {parsed.folder}{" "}
            <button
              onClick={() => openFolder(parsed.folder)}
              className="copy-button"
            >
              Відкрити
            </button>
          </p>

          <textarea
            placeholder="Коментар до проблеми..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={handleAddToList}>✅ Додати до списку</button>
        </div>
      )}

      {problems.length > 0 && (
        <div className="problem-list">
          <h4>📋 Список проблем:</h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Файл</th>
                <th>Модель</th>
                <th>Колір</th>
                <th>Шлях</th>
                <th>Коментар</th>
                <th>Дата</th>
                <th>Хто додав</th>
                <th>Дія</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.filename}</td>
                  <td>{item.model}</td>
                  <td>{item.color}</td>
                  <td>{item.folder}</td>
                  <td>{item.comment}</td>
                  <td>{item.createdAt}</td>
                  <td>{item.addedBy}</td>
                  <td>
                    <button onClick={() => openFolder(item.folder)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LatestProblemFileViewer;
