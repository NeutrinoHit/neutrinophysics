-- Cross-format rendering for the visual vocabulary of the book.
-- HTML keeps videos and live interactive slides inside the page. EPUB uses
-- local videos, while PDF receives a poster and a branded QR code.

local function has_class(el, name)
  return el.classes:includes(name)
end

local function add_class(el, name)
  if not has_class(el, name) then
    el.classes:insert(name)
  end
end

local function value_or_empty(value)
  return value or ""
end

local function project_path(value)
  value = value_or_empty(value)
  if FORMAT:match("latex") or FORMAT:match("epub") then
    return value:gsub("^%.%./", "")
  end
  return value
end

local function html_escape(value)
  return value_or_empty(value)
    :gsub("&", "&amp;")
    :gsub("<", "&lt;")
    :gsub(">", "&gt;")
    :gsub('"', "&quot;")
end

local function latex_escape(value)
  return value_or_empty(value)
    :gsub("\\", "\\textbackslash{}")
    :gsub("([%%#$&_{}])", "\\%1")
    :gsub("%~", "\\textasciitilde{}")
    :gsub("%^", "\\textasciicircum{}")
end

local function heading(title, label)
  local content = {}
  if label ~= "" then
    content[#content + 1] = pandoc.Strong(label)
  end
  if title ~= "" then
    if #content > 0 then
      content[#content + 1] = pandoc.Str(". ")
    end
    content[#content + 1] = pandoc.Strong(title)
  end
  return pandoc.Para(content)
end

local function latex_box(blocks, identifier, options)
  local result = {}
  if identifier ~= "" then
    result[#result + 1] = pandoc.RawBlock(
      "latex",
      "\\hypertarget{" .. identifier .. "}{}"
    )
  end
  result[#result + 1] = pandoc.RawBlock(
    "latex",
    "\\begin{semanticpdfbox}" .. (options or "")
  )
  for _, block in ipairs(blocks) do
    result[#result + 1] = block
  end
  result[#result + 1] = pandoc.RawBlock("latex", "\\end{semanticpdfbox}")
  return result
end

local function biography_sources(div)
  local source = value_or_empty(div.attributes.source)
  local source_label = value_or_empty(div.attributes["source-label"])
  local photo_source = value_or_empty(div.attributes["photo-source"])
  local photo_credit = value_or_empty(div.attributes["photo-credit"])
  local inlines = {}

  if source ~= "" then
    inlines[#inlines + 1] = pandoc.Strong("Источник:")
    inlines[#inlines + 1] = pandoc.Space()
    inlines[#inlines + 1] = pandoc.Link(
      {pandoc.Str(source_label ~= "" and source_label or source)},
      source
    )
  end
  if photo_source ~= "" then
    if #inlines > 0 then
      inlines[#inlines + 1] = pandoc.Str(";")
      inlines[#inlines + 1] = pandoc.Space()
    end
    inlines[#inlines + 1] = pandoc.Str("фото")
    inlines[#inlines + 1] = pandoc.Space()
    inlines[#inlines + 1] = pandoc.Link(
      {pandoc.Str(photo_credit ~= "" and photo_credit or "источник")},
      photo_source
    )
  elseif photo_credit ~= "" then
    if #inlines > 0 then
      inlines[#inlines + 1] = pandoc.Str(";")
      inlines[#inlines + 1] = pandoc.Space()
    end
    inlines[#inlines + 1] = pandoc.Str("фото:")
    inlines[#inlines + 1] = pandoc.Space()
    inlines[#inlines + 1] = pandoc.Str(photo_credit)
  end

  return inlines
end

local function render_biography(div)
  local name = value_or_empty(div.attributes.name)
  local years = value_or_empty(div.attributes.years)
  local photo_html = value_or_empty(div.attributes.photo)
  local photo_fixed = project_path(div.attributes.photo)
  local photo_alt = value_or_empty(div.attributes["photo-alt"])
  local photo_source = value_or_empty(div.attributes["photo-source"])
  local sources = biography_sources(div)

  if FORMAT:match("html") or FORMAT:match("epub") then
    local photo = ""
    if photo_html ~= "" then
      local src = FORMAT:match("epub") and photo_fixed or photo_html
      local image = string.format(
        '<img class="biography-portrait" src="%s" alt="%s" />',
        html_escape(src),
        html_escape(photo_alt ~= "" and photo_alt or name)
      )
      if photo_source ~= "" then
        image = string.format(
          '<a href="%s" target="_blank" rel="noopener noreferrer">%s</a>',
          html_escape(photo_source),
          image
        )
      end
      photo = '<div class="biography-photo">' .. image .. '</div>'
    end

    local years_html = ""
    if years ~= "" then
      years_html = string.format(
        '<div class="biography-years">%s</div>',
        html_escape(years)
      )
    end
    local identifier = ""
    if div.identifier ~= "" then
      identifier = string.format(' id="%s"', html_escape(div.identifier))
    end
    local blocks = {
      pandoc.RawBlock(
        "html",
        '<aside class="biography"' .. identifier .. '>' .. photo ..
        '<div class="biography-copy"><div class="biography-label">Биография</div>' ..
        '<div class="biography-name">' .. html_escape(name) .. '</div>' ..
        years_html
      )
    }
    for _, block in ipairs(div.content) do
      blocks[#blocks + 1] = block
    end
    if #sources > 0 then
      blocks[#blocks + 1] = pandoc.Div(
        {pandoc.Para(sources)},
        pandoc.Attr("", {"biography-sources"})
      )
    end
    blocks[#blocks + 1] = pandoc.RawBlock("html", "</div></aside>")
    return blocks
  end

  local blocks = {}
  if div.identifier ~= "" then
    blocks[#blocks + 1] = pandoc.RawBlock(
      "latex",
      "\\hypertarget{" .. div.identifier .. "}{}"
    )
  end
  blocks[#blocks + 1] = pandoc.RawBlock(
    "latex",
    "\\begin{semanticpdfbox}[colback=bookBiographySoft,borderline west={1.2mm}{0pt}{bookBiography},breakable=false]"
  )
  if photo_fixed ~= "" then
    blocks[#blocks + 1] = pandoc.RawBlock(
      "latex",
      "\\noindent\\begin{minipage}[t]{30mm}\\vspace{0pt}\\centering"
    )
    local photo_image = pandoc.Image(
      {pandoc.Str(photo_alt ~= "" and photo_alt or name)},
      photo_fixed,
      "",
      pandoc.Attr("", {"biography-portrait"}, {width = "28mm"})
    )
    if photo_source ~= "" then
      blocks[#blocks + 1] = pandoc.Para({pandoc.Link({photo_image}, photo_source)})
    else
      blocks[#blocks + 1] = pandoc.Para({photo_image})
    end
    blocks[#blocks + 1] = pandoc.RawBlock(
      "latex",
      "\\end{minipage}\\hfill\\begin{minipage}[t]{\\dimexpr\\linewidth-35mm\\relax}\\vspace{0pt}"
    )
  end
  blocks[#blocks + 1] = pandoc.RawBlock(
    "latex",
    "{\\sffamily\\bfseries\\footnotesize\\color{bookBiography} БИОГРАФИЯ\\par}" ..
    "\\vspace{0.8mm}{\\sffamily\\bfseries\\large\\color{bookInk} " ..
    latex_escape(name) .. "\\par}"
  )
  if years ~= "" then
    blocks[#blocks + 1] = pandoc.RawBlock(
      "latex",
      "{\\sffamily\\small\\color{bookMuted} " .. latex_escape(years) .. "\\par}\\vspace{1.4mm}"
    )
  end
  for _, block in ipairs(div.content) do
    blocks[#blocks + 1] = block
  end
  if #sources > 0 then
    blocks[#blocks + 1] = pandoc.RawBlock("latex", "{\\footnotesize\\color{bookMuted}")
    blocks[#blocks + 1] = pandoc.Para(sources)
    blocks[#blocks + 1] = pandoc.RawBlock("latex", "}")
  end
  if photo_fixed ~= "" then
    blocks[#blocks + 1] = pandoc.RawBlock("latex", "\\end{minipage}")
  end
  blocks[#blocks + 1] = pandoc.RawBlock("latex", "\\end{semanticpdfbox}")
  return blocks
end

local function render_animation(div)
  local title = value_or_empty(div.attributes.title)
  local src = value_or_empty(div.attributes.src)
  local epub_src = value_or_empty(div.attributes["epub-src"])
  local poster_html = value_or_empty(div.attributes.poster)
  local poster_fixed = project_path(div.attributes.poster)
  local url = value_or_empty(div.attributes.url)
  local qr_fixed = project_path(div.attributes.qr)

  if FORMAT:match("html") or FORMAT:match("epub") then
    local browser_src = src
    local browser_poster = poster_html
    if FORMAT:match("epub") then
      browser_src = project_path(epub_src ~= "" and epub_src or src)
      browser_poster = poster_fixed
    end

    local poster_attribute = ""
    if browser_poster ~= "" then
      poster_attribute = string.format(
        ' poster="%s"',
        html_escape(browser_poster)
      )
    end

    local media = ""
    if browser_src ~= "" then
      media = string.format(
        '<video controls="controls" loop="loop" muted="muted" playsinline="playsinline" preload="metadata"%s><source src="%s" type="video/mp4" />Ваш браузер не поддерживает video.</video>',
        poster_attribute,
        html_escape(browser_src)
      )
    elseif url ~= "" then
      media = string.format(
        '<iframe class="animation-embed" src="%s" title="%s" loading="lazy" allowfullscreen="allowfullscreen"></iframe>',
        html_escape(url),
        html_escape(title)
      )
    elseif poster_html ~= "" then
      media = string.format(
        '<img src="%s" alt="%s" />',
        html_escape(browser_poster),
        html_escape(title)
      )
    end

    local caption = ""
    if title ~= "" then
      caption = string.format("<figcaption>%s</figcaption>", html_escape(title))
    end

    local figure_id = ""
    if div.identifier ~= "" then
      figure_id = string.format(' id="%s"', html_escape(div.identifier))
    end
    local blocks = {
      pandoc.RawBlock(
        "html",
        '<figure class="animation-block"' .. figure_id .. '>' .. media
      )
    }
    for _, block in ipairs(div.content) do
      blocks[#blocks + 1] = block
    end
    if caption ~= "" then
      -- EPUB requires figcaption to be the first or the last child of figure.
      blocks[#blocks + 1] = pandoc.RawBlock("html", caption)
    end
    blocks[#blocks + 1] = pandoc.RawBlock("html", "</figure>")
    return blocks
  end

  local blocks = {}
  if poster_fixed ~= "" then
    if FORMAT:match("latex") then
      blocks[#blocks + 1] = pandoc.RawBlock("latex", "\\begin{center}")
    end
    blocks[#blocks + 1] = pandoc.Para({
      pandoc.Image(
        {pandoc.Str(title)},
        poster_fixed,
        title,
        pandoc.Attr("", {"animation-poster"}, {width = "74%"})
      )
    })
    if FORMAT:match("latex") then
      blocks[#blocks + 1] = pandoc.RawBlock("latex", "\\end{center}")
    end
  end
  local has_qr = qr_fixed ~= "" and url ~= ""
  if FORMAT:match("latex") and has_qr then
    -- Keep the QR code inside the caption instead of letting it become an
    -- isolated fragment on the next page. The two-column caption also saves
    -- enough vertical space for most animation cards to remain intact.
    blocks[#blocks + 1] = pandoc.RawBlock(
      "latex",
      "\\noindent\\begin{minipage}[c]{\\dimexpr\\linewidth-30mm\\relax}"
    )
  end
  if title ~= "" then
    blocks[#blocks + 1] = heading(title, "Анимация")
  end
  for _, block in ipairs(div.content) do
    blocks[#blocks + 1] = block
  end
  if FORMAT:match("latex") and has_qr then
    blocks[#blocks + 1] = pandoc.RawBlock(
      "latex",
      "\\end{minipage}\\hfill\\begin{minipage}[c]{26mm}\\centering"
    )
  end
  if has_qr then
    blocks[#blocks + 1] = pandoc.Para({
      pandoc.Link({
        pandoc.Image(
          {pandoc.Str("QR-код анимации")},
          qr_fixed,
          "",
          pandoc.Attr("", {"animation-qr"}, {width = "24mm"})
        )
      }, url)
    })
  end
  if FORMAT:match("latex") and has_qr then
    blocks[#blocks + 1] = pandoc.RawBlock("latex", "\\end{minipage}")
  end

  if FORMAT:match("latex") then
    -- An animation card is one visual unit: poster, caption and QR code must
    -- move to the next page together instead of splitting at a page boundary.
    return latex_box(blocks, div.identifier, "[breakable=false]")
  end

  return pandoc.Div(
    blocks,
    pandoc.Attr(div.identifier, {"animation-block", "semantic-block"})
  )
end

local function render_marginfigure(div)
  add_class(div, "marginfigure")
  if FORMAT:match("epub") then
    local classes = pandoc.List:new()
    for _, class in ipairs(div.classes) do
      if class ~= "column-margin" then
        classes:insert(class)
      end
    end
    div.classes = classes
    add_class(div, "epub-marginfigure")
    return div
  end
  add_class(div, "column-margin")
  return div
end

local semantic_labels = {
  ["physical-comment"] = "Физический смысл",
  ["experimental-fact"] = "Экспериментальный факт",
  ["warning"] = "Важно"
}

function Div(div)
  if has_class(div, "quarto-book-part") and FORMAT:match("epub") then
    -- Pandoc otherwise drops Quarto part divs from the EPUB spine and TOC.
    -- Unwrapping preserves a real, unnumbered topic page.
    return div.content
  end

  if has_class(div, "topic-landing") and FORMAT:match("latex") then
    -- PDF topic pages build the same list automatically from the main TOC.
    return {}
  end

  if has_class(div, "biography") then
    return render_biography(div)
  end

  if has_class(div, "animation") then
    return render_animation(div)
  end

  if has_class(div, "marginfigure") then
    return render_marginfigure(div)
  end

  if has_class(div, "book-lead") then
    add_class(div, "semantic-block")
    if FORMAT:match("latex") then
      return latex_box(div.content, div.identifier, "")
    end
    return div
  end

  for class, label in pairs(semantic_labels) do
    if has_class(div, class) then
      local title = value_or_empty(div.attributes.title)
      div.content:insert(1, heading(title, label))
      add_class(div, "semantic-block")
      if FORMAT:match("latex") then
        local options = ""
        if class == "experimental-fact" then
          options = "[colback=bookBlueSoft,borderline west={1.2mm}{0pt}{bookBlue}]"
        elseif class == "warning" then
          options = "[colback=bookCoralSoft,borderline west={1.2mm}{0pt}{bookCoral}]"
        end
        return latex_box(div.content, div.identifier, options)
      end
      return div
    end
  end
end

function Image(image)
  -- Quarto copies fig-alt to a wrapper <div> in EPUB, where the `alt`
  -- attribute is invalid. The image still retains its meaningful Markdown
  -- alternative text (the figure caption), so remove only the EPUB-specific
  -- source attribute before Quarto creates the wrapper.
  if FORMAT:match("epub") then
    image.attributes["fig-alt"] = nil
  end
  return image
end

function Math(math)
  -- MathJax and EPUB MathML do not know the PDF-only macro from book.tex.
  -- Expand it only for non-LaTeX formats; the source retains \lambdabar.
  if not FORMAT:match("latex") then
    math.text = math.text:gsub("\\lambdabar", "\\overline{\\lambda}")
  end
  return math
end

local epub_lecture_targets = {
  ["chapters/01_neutrino_first_contact.qmd"] = "#sec-neutrino-101",
  ["chapters/02_parity_violation.qmd"] = "#sec-parity",
  ["chapters/03_neutrino_spin.qmd"] = "#sec-helicity",
  ["chapters/04_neutrino_mass_kinematics.qmd"] = "#sec-direct-neutrino-mass",
  ["chapters/05_electron_to_detector.qmd"] = "#sec-electron-to-detector",
  ["chapters/06_mac_e_spectrometer.qmd"] = "#sec-mac-e-spectrometer",
  ["chapters/07_katrin.qmd"] = "#sec-katrin",
  ["chapters/08_alternative_neutrino_mass.qmd"] = "#sec-alternative-neutrino-mass",
  ["chapters/09_vacuum_two_flavors.qmd"] = "#sec-vacuum-oscillations",
  ["chapters/10_vacuum_pmns.qmd"] = "#sec-vacuum-pmns",
  ["chapters/11_matter_refraction.qmd"] = "#откуда-берётся-преломление",
  ["chapters/12_matter_constant_density.qmd"] = "#постоянная-плотность",
  ["chapters/13_matter_adiabatic_msw.qmd"] = "#адиабатический-msw-эффект",
  ["chapters/14_matter_interference_pendulums.qmd"] = "#интерференция-и-маятники",
  ["chapters/15_matter_three_flavors.qmd"] = "#три-флэйвора-в-веществе",
  ["chapters/16_oscillation_paradoxes.qmd"] = "#парадоксы-и-тонкости-осцилляций-нейтрино",
  ["chapters/17_standard_model_neutrinos.qmd"] = "#нейтрино-в-стандартной-модели-1",
  ["chapters/18_electromagnetic_properties.qmd"] = "#электромагнитные-свойства-нейтрино",
  ["chapters/19_sterile_neutrinos.qmd"] = "#стерильные-нейтрино",
  ["chapters/20_neutrino_interactions.qmd"] = "#взаимодействие-нейтрино-с-веществом",
  ["chapters/21_detection_methods.qmd"] = "#экспериментальные-методы-детектирования",
  ["chapters/22_solar_neutrinos.qmd"] = "#солнечные-нейтрино-1",
  ["chapters/23_atmospheric_neutrinos.qmd"] = "#атмосферные-нейтрино-1",
  ["chapters/24_accelerator_neutrinos.qmd"] = "#ускорительные-нейтрино",
  ["chapters/25_reactor_neutrinos.qmd"] = "#реакторные-нейтрино",
  ["chapters/26_geophysical_neutrinos.qmd"] = "#геофизические-нейтрино",
  ["chapters/27_neutrinoless_double_beta_decay.qmd"] = "#безнейтринный-двойной-бета-распад",
  ["chapters/28_relic_neutrinos.qmd"] = "#реликтовые-нейтрино",
  ["chapters/29_uhe_astrophysical_neutrinos.qmd"] = "#астрофизические-нейтрино-сверхвысоких-энергий",
  ["chapters/30_supernova_neutrinos.qmd"] = "#нейтрино-от-сверхновой",
  ["chapters/31_global_analysis.qmd"] = "#глобальный-анализ",
  ["chapters/32_mixing_cp_violation.qmd"] = "#смешивание-и-cp-нарушение",
  ["chapters/33_new_physics.qmd"] = "#нейтрино-как-окно-в-новую-физику",
  ["chapters/34_neutrino_tomography.qmd"] = "#нейтринная-томография",
  ["chapters/35_reactor_monitoring.qmd"] = "#реакторы-как-мониторинг"
}

function Link(link)
  if FORMAT:match("epub") then
    local key = link.target:gsub("^%.%./", "")
    local target = epub_lecture_targets[key]
    if target then
      link.target = target
      return link
    end
  end
end

local inside_exercises = false

function Header(header)
  local title = pandoc.utils.stringify(header.content)

  if header.level == 1 then
    inside_exercises = false
  elseif header.level == 2 and title == "Задачи" then
    inside_exercises = true
  elseif inside_exercises
      and header.level == 2
      and (title:match("^Литература к главе")
        or title:match("^Литература к лекции")) then
    inside_exercises = false
  elseif inside_exercises then
    -- Individual problems are typographic labels, not sections of the
    -- lecture. Keep the common "Задачи" section in every TOC, but suppress
    -- its children and avoid duplicated numbers such as 5.13 / 05.1.
    add_class(header, "unnumbered")
    add_class(header, "unlisted")
    add_class(header, "exercise-heading")

    if FORMAT:match("latex") then
      local rendered = pandoc.write(
        pandoc.Pandoc({pandoc.Plain(header.content)}),
        "latex"
      ):gsub("%s+$", "")
      return pandoc.RawBlock(
        "latex",
        "\\par\\addvspace{3.2mm}\\nopagebreak[4]" ..
        "\\noindent{\\sffamily\\bfseries\\fontsize{11.2}{13.5}\\selectfont " ..
        rendered .. "}\\par\\nopagebreak[4]\\vspace{1.2mm}"
      )
    end

    return header
  end

  -- A numbered PDF lecture gets a dedicated opener: the normal lecture
  -- heading, followed by a lecture-local table of contents and a page break.
  -- Keeping the original Header preserves Quarto numbering and cross-references.
  if FORMAT:match("latex")
      and header.level == 1
      and not header.classes:includes("unnumbered") then
    return {
      header,
      pandoc.RawBlock("latex", "\\bookchapteropeningcontents")
    }
  end
  return header
end
