import { selectElement } from "./lib/html";
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
const renderMonetaryAmount = (amount: MonetaryAmount): string => {
  const render = (value: string | number): string => {
    if (amount.currency) return `${amount.currency} ${value}`;
    return typeof value === "number" ? `${value}` : value;
  };
  let result = "";
  if (amount.minValue)
    result += `min_value: ${render(amount.minValue ?? amount.value ?? 0)}\n`;
  if (amount.maxValue)
    result += `max_value: ${render(amount.maxValue ?? amount.value ?? 0)}\n`;
  return result;
};
const renderSalary = (salary: JobPosting["baseSalary"]): string => {
  let min: string, max: string;
  switch (typeof salary) {
    case "string":
      min = max = salary;
      break;
    case "number":
    case "bigint":
      min = max = `$${salary}`;
      break;
    case "object":
      return renderMonetaryAmount(salary);
    default:
      logger.err("Unknown salary type", salary);
  }

  return `min_value: ${min}\nmax_value: ${max}\n`;
};
const getLdJson = (logger: Logger): Array<string | null> => {
  return [...document.querySelectorAll("script[type='application/ld+json']")]
    .map((el: HTMLScriptElement) => parseJson(el))
    .map((result): JobPosting | null => {
      if (!result) return null;
      if (result["@type"] === "JobPosting") {
        logger.log("Found job posting", result);
        return result as JobPosting;
      } else {
        logger.err("Not a job posting", result);
        return null;
      }
    })
    .map((posting: JobPosting | null): string | null => {
      if (!posting) return null;
      let {
        baseSalary,
        datePosted,
        description,
        title,
        estimatedSalary,
        validThrough,
      } = posting;
      const url = window.location.href;
      let frontMatter = `---\ntitle: ${title}\nlink: ${url}\n`;
      if (baseSalary ?? estimatedSalary)
        frontMatter += renderSalary(baseSalary ?? estimatedSalary);
      if (datePosted) {
        datePosted = new Date(datePosted).toISOString().slice(0, 10);
        frontMatter += `date_posted: ${datePosted}`;
      } else {
        frontMatter += `date_posted: null`;
      }
      return frontMatter + "\n---\n\n" + toMd(description || "");
    });
};

(async () => {
  let ldJson = getLdJson(logger);
  if (!ldJson.length) logger.err("No json-ld scripts found");
  ldJson = ldJson.filter(Boolean) as string[];
  if (!ldJson.length) logger.err("No populated job postings found");
  let [result] = ldJson;
  if (!result) {
    logger.err("no valid job postings found");
    let el = await selectElement(logger); // errors if selection aborted
    result = `---\nlink: ${location.href}\n---\n\n` + toMd(el?.outerHTML);
  }

  console.log(result);
  await copyToClipboard(result);
  let datePosted = (/^date_posted: (.*)$/m.exec(result) ?? [null, null])[1];
  prompt("markdown copied to clipboard. Job posted:", datePosted);
})();
