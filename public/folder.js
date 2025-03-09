const itemRow = document.querySelectorAll('.itemRow');
const dialog = document.querySelector('dialog');
const dialogContainer = document.getElementById('dialogContainer');
const sizeContainer = document.getElementById('sizeContainer');
const itemName = document.getElementById('name');
const created = document.getElementById('created');
const updated = document.getElementById('updated');
const type = document.getElementById('type');
const size = document.getElementById('size');
const editLink = document.getElementById('editLink');
const downloadLink = document.getElementById('downloadLink');
const deleteLink = document.getElementById('deleteLink');

itemRow.forEach((row) => {
  row.addEventListener('click', (e) => {
    e.stopImmediatePropagation();

    if (e.target.tagName === 'A') {
      return;
    }

    const data = e.target.parentElement.dataset;
    const isFolder = data.type === 'folder';

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
    editLink.href = `/${routeName}/${data.id}/edit`;
    deleteLink.href = `/${routeName}/${data.id}/delete`;

    if (isFolder) {
      downloadLink.style.display = 'none';
      downloadLink.href = '#';
    } else {
      downloadLink.style.display = 'inline';
      downloadLink.href = `/${routeName}/${data.id}/download`;
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
