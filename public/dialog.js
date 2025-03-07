const fileRows = document.querySelectorAll('.fileRow');
const dialog = document.querySelector('dialog');
const dialogContainer = document.getElementById('dialogContainer');
const fileName = document.getElementById('fileName');
const created = document.getElementById('fileCreated');
const updated = document.getElementById('fileUpdated');
const type = document.getElementById('fileType');
const size = document.getElementById('fileSize');
const editLink = document.getElementById('editLink');
const downloadLink = document.getElementById('downloadLink');
const deleteLink = document.getElementById('deleteLink');

fileRows.forEach((row) => {
  row.addEventListener('click', (e) => {
    e.stopImmediatePropagation();
    const fileData = e.target.parentElement.dataset;

    fileName.textContent = fileData.name;
    created.textContent = fileData.created;
    updated.textContent = fileData.updated;
    type.textContent = fileData.type;
    size.textContent = fileData.size;

    editLink.href = `/files/${fileData.id}/edit`;
    downloadLink.href = `/files/${fileData.id}/download`;
    deleteLink.href = `/files/${fileData.id}/delete`;
    dialog.dataset.fileId = fileData.id;
    dialog.showModal();
  });
});

document.addEventListener('click', (e) => {
  if (dialog.open && !dialogContainer.contains(e.target)) {
    dialog.close();
  }
});
