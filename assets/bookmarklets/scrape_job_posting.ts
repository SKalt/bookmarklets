import { copyToClipboard, Logger } from "./lib/lib";
import { toMd } from "./lib/markdown";
const logger = new Logger("scrape_job_posting");
const parseJson = (el: HTMLScriptElement) => {
  try {
    return JSON.parse(el.textContent || "null");
  } catch (e) {
    logger.child("parse_json").err(e);
    return null;
  }
};

type MonetaryAmount = {
  currency?: string;
  minValue?: number;
  maxValue?: number;
  value?: string | number;
};
type JobPosting = {
  // see https://schema.org/JobPosting
  "@type": "JobPosting";
  "@context": "https://schema.org";
  baseSalary?: string | number | MonetaryAmount;
  datePosted?: string;
  directApply?: boolean;
  description?: string;
  employmentType?: string;
  estimatedSalary?: string | number | MonetaryAmount;
  experienceInPlaceOfEducation?: boolean;
  jobLocationType?: string;
  skills: string;
  title: string;
  validThrough?: string;
};
// TODO: html2md(description)

(async () => {
  const elements = [
    ...document.querySelectorAll('script[type="application/ld+json"]'),
  ] as HTMLScriptElement[];
  if (!elements.length) {
    logger.err("No json-ld scripts found");
    return;
  }
  const jobPostings = elements
    .map(parseJson)
    .map((json, i) => {
      if (!json) return null;
      if (json["@type"] === "JobPosting") {
        logger.log("Found job posting", elements[i], json);
        return json as JobPosting;
      } else {
        logger.err("Not a job posting", elements[i], json);
        return null;
      }
    })
    .filter(Boolean) as JobPosting[];
  let [first] = jobPostings;
  if (first) {
    let {
      baseSalary,
      datePosted,
      description,
      title,
      estimatedSalary,
      validThrough,
    } = first;
    const url = window.location.href;
    let frontMatter = `---\ntitle: ${title}\nlink: ${url}\n`;
    let minSalary =
      typeof baseSalary === "object"
        ? baseSalary.minValue ?? baseSalary.value ?? null
        : baseSalary
        ? baseSalary
        : typeof estimatedSalary === "object"
        ? estimatedSalary.minValue ?? null
        : estimatedSalary ?? null;
    if (minSalary) frontMatter += `min_salary: ${minSalary}\n`;

    let maxSalary =
      typeof baseSalary === "object"
        ? baseSalary.maxValue ?? baseSalary.value ?? null
        : baseSalary
        ? baseSalary
        : typeof estimatedSalary === "object"
        ? estimatedSalary.maxValue ?? null
        : estimatedSalary ?? null;
    if (maxSalary) frontMatter += `max_salary: ${maxSalary}\n`;
    if (datePosted) {
      datePosted = new Date(datePosted).toISOString().slice(0, 10);
      frontMatter += `datePosted: ${datePosted}\n`;
    } else {
      frontMatter += `datePosted: null\n`;
    }
    if (validThrough) {
      validThrough = new Date(validThrough).toISOString().slice(0, 10);
      frontMatter += `validThrough: ${validThrough}\n`;
    }
    frontMatter += `---\n\n`;
    logger.log("frontMatter", frontMatter);
    const md = frontMatter + toMd(description || "");
    console.log(md);
    try {
      await copyToClipboard(md);
      alert("markdown copied to clipboard");
    } catch (e) {
      logger.child("clipboard").err("can't write to clipboard", e);
    }
    prompt("date posted:", datePosted || "No date");
  } else {
    logger.err("No job postings found");
  }
})();
