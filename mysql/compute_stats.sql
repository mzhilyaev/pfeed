
### compute overall perfromance stats
select "Overall Performance across all sites and categories" as '';
(select cat, ruleset, total as docs, prec, recall
 from uptest
 where cat like "%OVERALL%" and domain like 'ANY' and ruleset like 'rulesDFR')
union
(select cat, ruleset, total as docs, prec, recall
 from uptest
 where cat like "%OVERALL%" and domain like 'ANY' and ruleset like 'licaDFR')
union
(select cat, ruleset, total as docs, prec, recall
 from uptest
 where cat like "%OVERALL%" and domain like 'ANY' and ruleset like 'ALL')
order by ruleset desc, cat desc;

#### compute average category performance
select "average category performance by rulesets" as '';
select ruleSet, SUM(1) cats, AVG(docs) as 'docs-per-cat', AVG(prec), AVG(recall)
from (
  select ruleset, cat, total as docs, if (prec >= 0, prec, 0) as prec, recall
   from uptest
  where cat not like "%OVERALL%" and domain like 'ANY' and total > 0
) as x
group by ruleset
order by ruleset desc;

select "average site performance by rulesets for top 100 content sites" as '';
select ruleSet, SUM(1) sites, AVG(docs) as 'docs-per-site', AVG(prec), AVG(recall)
from (
  select ruleSet, t.domain, total as docs, prec, recall, rank
    from uptest t, siteRanks s
    where t.domain = s.domain and cat like 'OVERALL'
          and t.domain not like 'ANY'
          and total > 1000
    order by rank
  limit 100
) as x
group by ruleset
order by ruleset desc;

select "average site performance by rulesets for top 500 content sites" as '';
select ruleSet, SUM(1) sites, AVG(docs) as 'docs-per-site', AVG(prec), AVG(recall)
from (
  select ruleSet, t.domain, total as docs, prec, recall, rank
    from uptest t, siteRanks s
    where t.domain = s.domain and cat like 'OVERALL'
          and t.domain not like 'ANY'
          and total > 1000
    order by rank
  limit 500
) as x
group by ruleset
order by ruleset desc;

#### compute over all performance per category
select "Individual category performance for combined ruleset" as '';
select cat, total as docs, if (prec >= 0, prec, 0) as prec, recall
 from uptest
 where cat not like "%OVERALL%" and domain like 'ANY' and ruleSet like 'ALL' and total > 0
 order by ruleset desc, docs desc;


### compute per site performance
select "Individual site performance, for top 100 content sites" as '';
select t.domain, total as docs, prec, recall, rank
  from uptest t, siteRanks s
  where t.domain = s.domain and cat like 'OVERALL'
        and t.domain not like 'ANY' and ruleset like 'ALL'
        and total > 1000
  order by rank
  limit 100;


