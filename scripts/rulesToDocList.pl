#!/usr/bin/perl

use strict;
use Data::Dumper;
use Getopt::Long;

my $help;
my $limit = 0;

if(
     !GetOptions (
            "help|h" => \$help ,
            "limit|l=i" => \$limit ,
     )
     || defined( $help )  ### or help is wanted
) {
        usage( );
}


sub usage {

   print "Usage $0 [OPTIONS]
   Generates doc list from stdin
            --help|-h       - prints this help
            \n";
    exit 1;
}


my $doclist;
my $lastPattern;

while (<STDIN>) {
  chomp($_);
  my ($pattern, $doc) = split(/,/, $_);
  if ($pattern ne $lastPattern) {
    if ($doclist && scalar(@doclist) > $limit) {
      print join(",", @$doclist)."\n";
    }
    $lastPattern = $pattern;
    $doclist = [$pattern];
  }
  push(@$doclist, $doc);
}

print join(",", @$doclist)."\n";

