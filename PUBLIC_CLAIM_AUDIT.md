# Public Claim Audit — Release Evidence Gates

## Purpose

This audit converts high-risk public copy into verifiable release requirements. A claim remains blocked until the repository has evidence showing that the exact statement is accurate, current, appropriately scoped, and legally/operationally supportable.

The production branch therefore defaults unreviewed SPA routes to `prelaunch.html` rather than relying on a disclaimer to cure potentially misleading content.

## Governing review standards

The review should use current primary-source requirements applicable to the actual entity and service model, including:

- Federal Trade Commission standards for truthful, non-misleading, adequately substantiated health-related advertising.
- Securities and Exchange Commission / applicable state investment-adviser rules if the platform or its personnel are acting as investment advisers or marketing advisory services.
- Internal Revenue Service rules applicable to the actual church/religious organization, exemption, contribution, and donor-deductibility facts.
- Applicable state privacy, charitable solicitation, professional licensing, consumer-protection, healthcare, and financial-services requirements.

This file is an engineering release checklist, not a legal opinion.

## Gate A — Health and well-being efficacy claims

### Current examples requiring evidence review

- Testimonial language attributing restored energy to spiritual healing and herbal protocols.
- Statements that members report reduced chronic pain, improved sleep, emotional release, or restored well-being after named practices.
- Claims that particular sound/frequency practices affect the nervous system, brain-wave activity, cellular function, insomnia, anxiety, or chronic stress.
- Statements that herbal protocols address specific health concerns.
- Statements implying energy healing, somatic practices, sound therapy, or herbal products cause therapeutic outcomes.

### Required release evidence

1. Inventory every express and reasonably implied health-benefit claim.
2. Identify the exact service/product/practice to which each claim applies.
3. Obtain qualified review of the scientific substantiation relevant to the exact claim.
4. Preserve substantiation records and review date.
5. Remove or materially narrow any claim that cannot be substantiated.
6. Verify practitioner credentials, scope of practice, supervision, and jurisdiction before describing a person as licensed/certified or offering regulated care.
7. Review testimonials separately; anecdotal experiences must not be used as the substantiation for efficacy claims.

**Status: BLOCKED**

## Gate B — Investment/advisory and fiduciary claims

### Current examples requiring evidence review

- “Certified wealth advisor.”
- “Professional financial planning.”
- “Investment advisory services.”
- “Every investment recommendation is made as a fiduciary.”
- Portfolio construction, asset allocation, investment vehicle selection, and personalized risk-profile language.
- Statements implying regulated advisory relationships or personalized investment recommendations.

### Required release evidence

1. Identify the legal entity delivering each financial service.
2. Verify whether the entity/person is registered, exempt, excluded, or otherwise authorized in each applicable jurisdiction and service scope.
3. Record the exact credential name, issuing body, current status, and permitted public description for every claimed certification/designation.
4. Determine whether “fiduciary” is accurate for the actual relationship and service being offered.
5. Review all testimonials, endorsements, performance/benefit claims, specific investment references, conflicts, and required disclosures under applicable marketing rules.
6. Separate general financial education from personalized regulated advice in product design and public wording.

**Status: BLOCKED**

## Gate C — Ministry, church, PHA, and tax-status claims

### Current examples requiring evidence review

- “508(c)(1)(a) Spiritual Healing Ministry.”
- Statements that ministry governance or a private association creates particular legal protections.
- “Private contract law” or similar categorical legal-effect language.
- Statements that contributions are tax deductible or that tax receipts will be provided.
- Statements that particular services are legally protected because they occur inside a covenant/private association.

### Required release evidence

1. Identify the exact legal/religious entity and governing documents.
2. Obtain entity-specific tax/legal review of the claimed status; do not treat a Code citation or organizational label as self-proving.
3. Verify church/religious-organization facts and any applicable filing/recognition history.
4. Verify donor-deductibility and charitable-solicitation treatment before displaying tax-deduction or receipt claims.
5. Review the actual PHA/private-association documents and the scope of any claimed legal effect.
6. Remove categorical statements of legality, immunity, privacy, exemption, or regulatory avoidance unless counsel supports the exact wording and context.

**Status: BLOCKED**

## Gate D — Credentials and role titles

### Current examples requiring evidence review

- Ordained minister.
- Alignable Alliance Ambassador of Hartford, CT.
- Certified wealth advisor.
- Certified holistic coach.
- Ministry-approved or trained practitioners.
- Professional/advisory team descriptions.

### Required release evidence

For every title:

- subject/person identity;
- issuing/appointing organization;
- credential or appointment name;
- effective/expiration dates where applicable;
- public verification record or retained source evidence;
- restrictions on how the title may be represented.

**Status: BLOCKED until per-title evidence is attached**

## Gate E — Testimonials and member-history claims

### Current examples requiring evidence review

- Named testimonials and member roles/dates.
- Health-effect testimonials.
- Statements implying specific financial transformation or life-changing outcomes.

### Required release evidence

1. Written authorization to publish the person’s name/image/statement where required.
2. Record showing the statement is authentic and accurately reproduced.
3. Disclosure of material relationships or compensation where applicable.
4. Separate substantiation for any objective health or financial benefit implied by the testimonial.
5. Review whether a pseudonym, stock photo, or fictional example is being presented as a real member; if so, remove or relabel it clearly.

**Status: BLOCKED**

## Gate F — Metrics, impact, and volume claims

### Current examples requiring evidence review

- “5,200 Active Members.”
- “120+ Wealth Plans.”
- “$2.4M Wealth Guided.”
- “98% Satisfaction.”
- “Over 200” subsidized memberships.
- “Hundreds” served by ministry outreach.
- Dollar-to-impact statements tied to donation amounts.

### Required release evidence

For every metric:

- source system/dataset;
- query or calculation method;
- measurement period;
- definition of numerator/denominator and terms such as “active,” “guided,” or “satisfaction”;
- responsible owner;
- last verified date;
- evidence that the metric remains current when displayed.

**Status: BLOCKED**

## Gate G — Service availability and promises

### Current examples requiring evidence review

- Specific membership benefits and prices.
- Claimed practitioner access or booking availability.
- Response-time promises.
- Program cohort dates/capacity/inclusions.
- “No additional cost” or discount promises.
- Donation receipt/refund expectations.

### Required release evidence

1. Service owner and fulfillment process.
2. Operational system supporting the promise.
3. Approved pricing/terms.
4. Capacity and availability source of truth.
5. Support/escalation path.
6. Policy governing cancellation/refund/change.

**Status: BLOCKED except for the explicitly implemented contact and membership-interest submission workflows**

## Re-enable procedure

A legacy route may be restored from the pre-launch gate only when:

1. its claims are inventoried;
2. each claim has an evidence owner and release status;
3. unsupported claims are removed or rewritten;
4. required policy/disclosure text has been reviewed;
5. the route’s operational actions work end to end;
6. automated and manual release checks pass;
7. the Trust Center is updated to reflect the verified state.

No route should be re-enabled based only on visual completeness.
