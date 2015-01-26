#!/usr/bin/perl

use strict;
use Data::Dumper;
use JSON;
use Getopt::Long;
use XML::Simple;

my $help;

if(
     !GetOptions (
            "help|h" => \$help ,
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
    if ($doclist) {
      print join(",", @$doclist)."\n";
    }
    $lastPattern = $pattern;
    $doclist = [$pattern];
  }
  push(@$doclist, $doc);
}

print join(",", @$doclist)."\n";

