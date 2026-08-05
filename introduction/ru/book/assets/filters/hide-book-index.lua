local book_title = "Введение в физику нейтрино"

function Header(header)
  local is_book_index = header.level == 1
    and pandoc.utils.stringify(header.content) == book_title

  if is_book_index then
    return {}
  end
end
