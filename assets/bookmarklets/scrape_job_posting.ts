import { selectElement } from "./lib/html";
import { copyToClipboard, Logger } from "./lib/lib";
import { defaultCallbacks, toMd } from "./lib/markdown";
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

type Organization = {
  "@type": "Organization";
  "@context"?: "https://schema.org";
  name?: string;
  url?: string;
  logo?: string;
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
  hiringOrganization?: Organization;
  estimatedSalary?: string | number | MonetaryAmount;
  experienceInPlaceOfEducation?: boolean;
  jobLocationType?: string;
  skills: string;
  title: string;
  validThrough?: string;
};

const toNumber = (value: number | string): number => {
  switch (typeof value) {
    case "string":
      const n = parseFloat(value.replaceAll(/[^0-9]/g, ""));
      return /k$/i.test(value) ? n * 1000 : n;
    case "number":
    case "bigint":
      return value;
    default:
      logger.err("Unable to coerce to number", value);
  }
  return 0; // TODO: sane default?
};

const renderSalary = (
  salary: JobPosting["baseSalary"]
): { min_value: number; max_value: number } | null => {
  if (!salary) return null;
  const result = { min_value: 0, max_value: 0 };
  switch (typeof salary) {
    case "string":
      result.min_value = toNumber(salary);
      result.max_value = result.min_value;
      return result;
    case "number":
    case "bigint":
      result.min_value = salary;
      result.max_value = result.min_value;
      return result;
    case "object":
      // cast as MonetaryAmount
      let _: MonetaryAmount = salary;
      if (_.minValue) {
        result.min_value = _.minValue;
        if (_.maxValue) result.max_value = _.maxValue;
      } else if (_.value)
        result.max_value = result.min_value = toNumber(_.value);
      return result;
    default:
      logger.err("Unknown salary type", salary);
      return null;
  }
};
type FrontMatter = {
  company: string;
  title: string;
  link: string;
  date_posted: string | null;
  min_value?: number | null;
  max_value?: number | null;
};

const renderFrontMatter = (frontMatter: FrontMatter): string => {
  let result = "---\n";

  for (let key of ["company", "title", "link", "date_posted"]) {
    const value = frontMatter[key];
    result += `${key}: ${value}\n`;
  }
  if (frontMatter.min_value) {
    result += `min_value: $${frontMatter.min_value}\n`;
    result += `max_value: $${frontMatter.max_value}\n`;
  }
  return result + "---\n\n";
};

const salaryNumberPattern = `\\$?\\d{2,3},?\\d{0,3}\.?\\d{0,2}[kK]?`;
const salaryPattern = new RegExp(
  `(?<min>${salaryNumberPattern})\\s*[-]\\s*(?<max>${salaryNumberPattern})`,
  "g"
);
const extractSalary = (
  md: string
): { min_value: number; max_value: number } | null => {
  let salary = salaryPattern.exec(md);
  return salary
    ? renderSalary({
        minValue: toNumber(salary[1]),
        maxValue: toNumber(salary[2]),
      })
    : null;
};

const getLdJson = (logger: Logger): Array<string | null> => {
  return [...document.querySelectorAll("script[type='application/ld+json']")]
    .map((el: HTMLScriptElement) => parseJson(el))
    .map((result): JobPosting | null => {
      if (!result) return null;
      if (result["@type"] === "JobPosting") {
        logger.info("Found job posting", result);
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
        hiringOrganization,
        validThrough,
      } = posting;
      const url = window.location.href;
      const frontMatter: FrontMatter = {
        company: hiringOrganization?.name?.trim() ?? "",
        title: title.trim(),
        date_posted: datePosted ?? null,
        link: url,
        ...(renderSalary(baseSalary ?? estimatedSalary) ?? {}),
      };
      const md = toMd(description || "", defaultCallbacks, logger);
      if (!frontMatter.min_value && !frontMatter.max_value) {
        Object.assign(frontMatter, extractSalary(md) ?? {});
      }

      return renderFrontMatter(frontMatter) + "\n" + md;
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
    const md = toMd(el?.outerHTML);
    const salary = extractSalary(md) ?? {};
    result =
      renderFrontMatter({
        company: "FIXME",
        title: "FIXME",
        link: location.href,
        date_posted: null,
        ...salary,
      }) + md;
  }

  // post-processing: many ld+json scripts contain '\\n' instead of '\n'
  result = result.replaceAll("\\n", "\n").replaceAll(/(\n[ \t]*){2,}/g, "\n\n");
  console.log(result);
  await copyToClipboard(result);
  let datePosted = (/^date_posted: (.*)$/m.exec(result) ?? [null, null])[1];
  prompt("markdown copied to clipboard. Job posted:", datePosted);
})();
