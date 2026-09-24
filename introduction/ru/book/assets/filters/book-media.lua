-- Neutrino-book adaptations that do not belong to the shared component layer.

local function has_class(el, name)
  return el.classes:includes(name)
end

local function add_class(el, name)
  if not has_class(el, name) then
    el.classes:insert(name)
  end
end

function Div(div)
  if has_class(div, "quarto-book-part") and FORMAT:match("epub") then
    return div.content
  end

  if has_class(div, "topic-landing") and FORMAT:match("latex") then
    return {}
  end

  if has_class(div, "marginfigure") then
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
end

function Image(image)
  if FORMAT:match("epub") then
    image.attributes["fig-alt"] = nil
  end
  return image
end

function Math(math)
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
  ["chapters/11_matter_refraction.qmd"] = "#sec-matter-refraction",
  ["chapters/12_matter_constant_density.qmd"] = "#sec-matter-constant-density",
  ["chapters/13_matter_adiabatic_msw.qmd"] = "#sec-matter-adiabatic-msw",
  ["chapters/14_matter_interference_pendulums.qmd"] = "#sec-matter-interference-pendulums",
  ["chapters/15_matter_three_flavors.qmd"] = "#sec-matter-three-flavors",
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
