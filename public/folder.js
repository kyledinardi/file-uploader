const itemRow = document.querySelectorAll('.itemRow');
const dialog = document.querySelector('dialog');
const dialogContainer = document.getElementById('dialogContainer');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('file');

const itemName = document.getElementById('name');
const created = document.getElementById('created');
const updated = document.getElementById('updated');
const type = document.getElementById('type');

const sizeContainer = document.getElementById('sizeContainer');
const size = document.getElementById('size');

const editLink = document.getElementById('editLink');
const downloadLink = document.getElementById('downloadLink');
const deleteLink = document.getElementById('deleteLink');

if (fileInput) {
  fileInput.addEventListener('change', () => uploadForm.submit());
}

itemRow.forEach((row) => {
  row.addEventListener('click', (e) => {
    e.stopImmediatePropagation();

    if (e.target.tagName === 'A') {
      return;
    }

    const data = e.target.parentElement.dataset;
    const isFolder = data.type === 'folder';
    const isShared = !editLink;

    itemName.textContent = data.name;
    created.textContent = data.created;
    updated.textContent = data.updated;
    type.textContent = data.type;

    if (isFolder) {
      sizeContainer.style.display = 'none';
      size.textContent = '';
    } else {
      sizeContainer.style.display = 'block';
      size.textContent = data.size;
    }

    const routeName = isFolder ? 'folders' : 'files';

    if (!isShared) {
      editLink.href = `/${routeName}/${data.id}/edit`;
      deleteLink.href = `/${routeName}/${data.id}/delete`;
    }

    if (isFolder) {
      downloadLink.style.display = 'none';
      downloadLink.href = '#';
    } else {
      downloadLink.style.display = 'inline';

      if (isShared) {
        downloadLink.href = `/shares/${data.shareId}/files/${data.id}`;
      } else {
        downloadLink.href = `/files/${data.id}`;
      }
    }

    dialog.dataset.fileId = data.id;
    dialog.showModal();
  });
});

document.addEventListener('click', (e) => {
  if (dialog.open && !dialogContainer.contains(e.target)) {
    dialog.close();
  }
});
