
1. generate category/site stats from corpus
>> cd pfeed/scripts
>> ./generateDFRStats.js -d MONGO_HOST -l 40000000 -f 2014/10/30 ../refData/licaDFR.json ../refData/rulesDFR.json > ../mysql/stats.out

2. create test database and tables
>> cd pfeed/mysql
>> echo "create database up" | mysql -u admin
>> mysql -u admin up < create_tables.sql

3. populate tables with stats and rank data
mysql -u admin up
mysql >> delete from siteRanks;
mysql >> load data infile '/Users/maximzhilyaev/pfeed/mysql/top50K.sites' into table siteRanks FIELDS TERMINATED BY ' ';
mysql >> delete from uptest;
mysql >> load data infile '/Users/maximzhilyaev/pfeed/mysql/stats.out' into table uptest FIELDS TERMINATED BY ',';

4. generate reports
mysql -u admin --column-names --table up < compute_stats.sql
