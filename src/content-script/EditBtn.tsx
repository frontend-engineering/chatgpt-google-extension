import { useState } from 'preact/hooks'

function EditBtn(props: any) {
  const [editing, setEditing] = useState(false)
  const onEdit = props?.onEdit
  return (
    <button
      className="Button Button--primary Button--blue zhiplus-btn"
      onClick={(e) => {
        e.preventDefault()
        onEdit && onEdit(editing)
        setEditing(!editing)
      }}
    >
      {editing ? '完成编辑' : '编辑问题'}
    </button>
  )
}

export default EditBtn
