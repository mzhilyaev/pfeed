drop table IF EXISTS uptest;
create table IF NOT EXISTS uptest (
  domain VARCHAR(80),
  ruleSet VARCHAR(80),
  cat VARCHAR(150),
  prec INTEGER,
  recall INTEGER UNSIGNED,
  total INTEGER UNSIGNED
);

drop table IF EXISTS siteRanks;
create table IF NOT EXISTS siteRanks (
  domain VARCHAR(80),
  rank INTEGER UNSIGNED
);



