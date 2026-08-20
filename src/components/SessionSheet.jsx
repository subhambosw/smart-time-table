import React from "react";

export default function SessionSheet({ dialogRef, selectedBlock, onSave, onCancel }) {
  return (
    <dialog
      ref={dialogRef}
      style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      {selectedBlock && (
        <div>
          <h2>Edit Session</h2>
          <form onSubmit={onSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label>Class / Text</label>
              <input name="text" defaultValue={selectedBlock.text} key={selectedBlock.id} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--surface2)", color: "var(--text2)", cursor: "pointer", fontSize: 12
                }}
              >Cancel</button>
              <button
                type="submit"
                style={{
                  padding: "7px 14px", borderRadius: 8, border: "none",
                  background: "var(--brand)", color: "#fff", cursor: "pointer",
                  fontSize: 12, fontWeight: 600
                }}
              >Save Changes</button>
            </div>
          </form>
        </div>
      )}
    </dialog>
  );
}
